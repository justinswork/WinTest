"""ShowUI-2B vision model — purpose-built for GUI click grounding."""

import ast
import logging
import os
import re
import tempfile

import torch
from PIL import Image
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig

from .base import BaseVisionModel

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "Based on the screenshot of the page, I give a text description and you "
    "give its corresponding location. The coordinate represents a clickable "
    "location [x, y] for an element, which is a relative coordinate on the "
    "screenshot, scaled from 0 to 1."
)


class ShowUIModel(BaseVisionModel):
    """ShowUI-2B: GUI-specialized click grounding model."""

    MIN_PIXELS = 256 * 28 * 28
    MAX_PIXELS = 1344 * 28 * 28

    def __init__(self, model_settings):
        self.settings = model_settings
        self.model_path = model_settings.model_path
        self.model = None
        self.processor = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return

        logger.info("Loading ShowUI-2B (this may take a minute)...")

        load_kwargs = {
            "torch_dtype": torch.bfloat16,
            "device_map": "auto",
        }

        if self.settings.load_in_4bit:
            load_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type=self.settings.bnb_4bit_quant_type,
                bnb_4bit_use_double_quant=self.settings.bnb_4bit_use_double_quant,
            )

        self.model = Qwen2VLForConditionalGeneration.from_pretrained(
            self.model_path, **load_kwargs
        ).eval()

        self.processor = AutoProcessor.from_pretrained(
            self.model_path,
            min_pixels=self.MIN_PIXELS,
            max_pixels=self.MAX_PIXELS,
        )

        self._loaded = True
        logger.info("Model loaded successfully.")

    def find_element(self, screenshot: Image.Image, element_name: str) -> dict:
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        from qwen_vl_utils import process_vision_info

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
                screenshot.save(f, format="PNG")
                tmp_path = f.name

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _SYSTEM_PROMPT},
                        {
                            "type": "image",
                            "image": tmp_path,
                            "min_pixels": self.MIN_PIXELS,
                            "max_pixels": self.MAX_PIXELS,
                        },
                        {"type": "text", "text": element_name},
                    ],
                }
            ]

            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to("cuda")

            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs, max_new_tokens=self.settings.max_new_tokens
                )

            generated_ids_trimmed = [
                out_ids[len(in_ids):]
                for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            response = self.processor.batch_decode(
                generated_ids_trimmed,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )[0]

            coordinates = self.parse_coordinates(response)
            return {"raw_response": response, "coordinates": coordinates}

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    @staticmethod
    def parse_coordinates(response_text: str) -> tuple[int, int] | None:
        """Parse ShowUI [x, y] output (0-1 scale) and convert to 0-1000."""
        text = response_text.strip()

        # Try ast.literal_eval for clean [x, y] output
        try:
            parsed = ast.literal_eval(text)
            if isinstance(parsed, list) and len(parsed) == 2:
                x, y = float(parsed[0]), float(parsed[1])
                if 0 <= x <= 1.0 and 0 <= y <= 1.0:
                    return BaseVisionModel.coords_01_to_1000(x, y)
        except (ValueError, SyntaxError):
            pass

        # Regex fallback: float pair in brackets
        float_match = re.search(r"\[([\d.]+)\s*,\s*([\d.]+)\]", text)
        if float_match:
            try:
                x, y = float(float_match.group(1)), float(float_match.group(2))
                if 0 <= x <= 1.0 and 0 <= y <= 1.0:
                    return BaseVisionModel.coords_01_to_1000(x, y)
            except ValueError:
                pass

        return None
