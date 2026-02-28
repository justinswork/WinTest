import torch
import pyautogui
import os
from PIL import Image
from transformers import AutoModel, AutoTokenizer, BitsAndBytesConfig, GenerationMixin, GenerationConfig
import torchvision.transforms as T
from torchvision.transforms.functional import InterpolationMode

# --- 1. SETTINGS & LOADING (The Brain) ---
model_path = "OpenGVLab/InternVL2-8B"

print("Loading AI Brain (this may take a minute)...")

# Change bfloat16 to float16 here
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16, # Changed from bfloat16
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True
)

tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
model = AutoModel.from_pretrained(
    model_path,
    quantization_config=quant_config,
    device_map="auto",
    trust_remote_code=True
).eval()

# Patch: transformers >=4.50 removed GenerationMixin from PreTrainedModel,
# so InternLM2ForCausalLM lost its .generate() method. Re-inject it.
lm_cls = type(model.language_model)
if GenerationMixin not in lm_cls.__mro__:
    lm_cls.__bases__ = (GenerationMixin,) + lm_cls.__bases__
if model.language_model.generation_config is None:
    model.language_model.generation_config = GenerationConfig()
# Monkey-patch prepare_inputs_for_generation to handle new DynamicCache objects.
# The old InternLM2 code assumes past_key_values is a tuple-of-tuples.
_orig_prepare = type(model.language_model).prepare_inputs_for_generation

def _patched_prepare(self, input_ids, past_key_values=None, attention_mask=None, inputs_embeds=None, **kwargs):
    if past_key_values is not None and not isinstance(past_key_values, tuple):
        if hasattr(past_key_values, 'get_seq_length'):
            seq_len = past_key_values.get_seq_length()
            if seq_len == 0:
                past_key_values = None
            else:
                past_key_values = past_key_values.to_legacy_cache()
    return _orig_prepare(self, input_ids, past_key_values=past_key_values,
                         attention_mask=attention_mask, inputs_embeds=inputs_embeds, **kwargs)

type(model.language_model).prepare_inputs_for_generation = _patched_prepare

# --- 2. IMAGE HELPERS (The Eyes) ---
def preprocess_image(image, input_size=448):
    transform = T.Compose([
        T.Resize((input_size, input_size), interpolation=InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))
    ])
    # Match the type to float16 to match the model weights
    return transform(image).unsqueeze(0).to(torch.float16).to("cuda")

# --- 3. THE ACTION (The Reasoning) ---
def find_element_on_screen(target_name):
    # Take a live screenshot
    print(f"\nScanning screen for: '{target_name}'...")
    screenshot = pyautogui.screenshot()
    
    # Preprocess for the AI
    pixel_values = preprocess_image(screenshot)
    
    # Define the request
    # InternVL2 usually likes a specific format for UI tasks:
    question = f"<image>\nPlease provide the bounding box center coordinates of the '{target_name}' as [x, y] on a 0-1000 scale."
    
    # We call the specific model.chat with a 'trust' flag 
    # OR we use the direct generation if the wrapper is broken
    with torch.no_grad():
        response = model.chat(
            tokenizer,
            pixel_values,
            question,
            generation_config=dict(max_new_tokens=100),
            history=None
        )
    
    return response

# --- 4. EXECUTION ---
if __name__ == "__main__":
    print("Success! System Online.")
    print(f'CUDA Available: {torch.cuda.is_available()}')
    if torch.cuda.is_available():
        print(f'GPU Name: {torch.cuda.get_device_name(0)}')
    else:
        print("GPU Name: None")


    # Let's test it!
    target = "Windows Start button"
    result = find_element_on_screen(target)
    
    print("-" * 30)
    print(f"TARGET: {target}")
    print(f"AI RESPONSE: {result}")
    print("-" * 30)