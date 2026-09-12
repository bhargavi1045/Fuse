function TextInput({ label, type = 'text', value, onChange, placeholder, autoComplete, required = false }) {
  return (
    <label className="bz-field">
      <span className="bz-field__label">{label}</span>
      <input
        className="bz-field__input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </label>
  );
}

export default TextInput;
