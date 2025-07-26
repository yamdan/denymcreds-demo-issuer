import React, { useState, useEffect } from 'react';
import { type Translations } from '../utils/i18n';
import TextareaAutosize from 'react-textarea-autosize';

interface Props {
  header: string;
  onHeaderChange: (header: string) => void;
  t: Translations;
}

const HeaderSection: React.FC<Props> = ({ header, onHeaderChange, t }) => {
  const [autoRemoveWhitespace, setAutoRemoveWhitespace] = useState<boolean>(false);
  const [formattedHeader, setFormattedHeader] = useState<string>('');

  useEffect(() => {
    if (autoRemoveWhitespace) {
      formatJson();
    } else {
      setFormattedHeader(header);
    }
  }, [header, autoRemoveWhitespace]);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(header);
      const formatted = autoRemoveWhitespace
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, 2);
      setFormattedHeader(formatted);
      if (autoRemoveWhitespace) {
        onHeaderChange(formatted);
      }
    } catch (error) {
      alert(`${t.invalidJson}: ${error}`);
    }
  };

  const handleHeaderChange = (value: string) => {
    onHeaderChange(value);
    if (!autoRemoveWhitespace) {
      setFormattedHeader(value);
    }
  };

  return (
    <div className="section">
      <h2>{t.headerSection}</h2>

      <div className="header-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoRemoveWhitespace}
            onChange={(e) => setAutoRemoveWhitespace(e.target.checked)}
          />
          {t.autoRemoveWhitespace}
        </label>
      </div>

      <div className="input-section">
        <label>{t.jsonInput}:</label>
        <TextareaAutosize
          value={header}
          onChange={(e) => handleHeaderChange(e.target.value)}
          className="json-input"
          placeholder='{"alg":"DENYM-ES256","typ":"JPT","iss":"https://issuer.example","kid":"1"}'
        />
      </div>

      {formattedHeader !== header && (
        <div className="preview-section">
          <label>{t.jsonPreview}:</label>
          <pre className="json-preview">{formattedHeader}</pre>
        </div>
      )}
    </div>
  );
};

export default HeaderSection;
