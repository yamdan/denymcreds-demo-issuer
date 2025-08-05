import React, { useState, useEffect, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { type Translations } from '../utils/i18n';

interface Props {
  userPk: string;
  onUserPkChange: (userPk: string) => void;
  header: string;
  t: Translations;
}

interface UserPkJwk {
  kty: string;
  k: string;
  c: string;
}

// Default JWK example (moved outside component to avoid recreating on each render)
const defaultContext = `${window.location.origin}${window.location.pathname}`;
const defaultJwk = {
  kty: "nym",
  k: "FO0qROb_uMlNMAjLcar9ikfMcEuX30cVBKD5Fgxy710",
  c: defaultContext
};

const UserPkSection: React.FC<Props> = ({ onUserPkChange, header, t }) => {
  const [jwkInput, setJwkInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const validateAndSetUserPk = useCallback((input: string) => {
    setError('');
    
    if (!input.trim()) {
      onUserPkChange('');
      return;
    }

    try {
      const jwk: UserPkJwk = JSON.parse(input);
      
      // Validate required fields
      if (!jwk.kty || !jwk.k || !jwk.c) {
        setError(t.invalidUserPkJwk);
        onUserPkChange('');
        return;
      }

      // Validate kty field
      if (jwk.kty !== 'nym') {
        setError(t.invalidUserPkJwk);
        onUserPkChange('');
        return;
      }

      // Extract iss from header and validate context match
      try {
        const headerObj = JSON.parse(header);
        if (headerObj.iss && jwk.c !== headerObj.iss) {
          setError(t.contextMismatch);
          onUserPkChange('');
          return;
        }
      } catch {
        // If header is invalid JSON, we can't validate context match
        // but we can still accept the JWK
      }

      // All validations passed
      onUserPkChange(jwk.k);
    } catch {
      setError(t.invalidUserPkJwk);
      onUserPkChange('');
    }
  }, [header, onUserPkChange, t.invalidUserPkJwk, t.contextMismatch]);

  // Initialize with default JWK
  useEffect(() => {
    const defaultJwkString = JSON.stringify(defaultJwk, null, 2);
    setJwkInput(defaultJwkString);
    validateAndSetUserPk(defaultJwkString);
  }, [validateAndSetUserPk]);

  const handleInputChange = (value: string) => {
    setJwkInput(value);
    validateAndSetUserPk(value);
  };

  return (
    <div className="section">
      <h2>{t.userPkSection}</h2>

      <div className="section-content">
        <div className="input-group">
          <label>{t.userPkInput}:</label>
          <TextareaAutosize
            value={jwkInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={JSON.stringify(defaultJwk, null, 2)}
            className="json-input"
          />
          {error && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPkSection;
