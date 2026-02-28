import { useTaskStore } from '../../stores/taskStore';

interface Props {
  value: string;
  onChange: (action: string) => void;
}

export function ActionPicker({ value, onChange }: Props) {
  const { actions } = useTaskStore();

  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input">
      {actions.map(a => (
        <option key={a.name} value={a.name}>{a.name}</option>
      ))}
    </select>
  );
}
