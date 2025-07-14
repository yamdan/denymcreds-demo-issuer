import React, { useState, useEffect, useCallback } from 'react';
import elliptic from 'elliptic';
import { genKey, base64urlEncode } from '../utils/sign';
import { type Translations } from '../utils/i18n';

const EC = elliptic.ec;
const ec = new EC('p256');

interface Props {
  issuerSk: number[];
  onIssuerSkChange: (sk: number[]) => void;
  t: Translations;
}

type KeyInputMode = 'random' | 'manual';
type ManualInputFormat = 'hex' | 'array';

const IssuerKeySection: React.FC<Props> = ({ issuerSk, onIssuerSkChange, t }) => {
  const [mode, setMode] = useState<KeyInputMode>('manual');
  const [manualFormat, setManualFormat] = useState<ManualInputFormat>('hex');
  const [manualInput, setManualInput] = useState<string>('0x576e3f0b4ddb5663457b354d70357ecf41a93e2920231ad792342d47ea162c71');
  const [jwk, setJwk] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');

  const generateJwkFromSk = useCallback((privateKeyNumbers: number[]) => {
    try {
      const keyPair = ec.keyFromPrivate(privateKeyNumbers);
      const publicKey = keyPair.getPublic();
      
      const jwkObj = {
        kty: 'EC',
        crv: 'P-256',
        x: base64urlEncode(new Uint8Array(publicKey.getX().toArray('be', 32))),
        y: base64urlEncode(new Uint8Array(publicKey.getY().toArray('be', 32))),
        d: base64urlEncode(new Uint8Array(privateKeyNumbers)),
        kid: '1',
      };
      
      setJwk(JSON.stringify(jwkObj, null, 2));
    } catch (error) {
      console.error('JWK generation error:', error);
    }
  }, []);

  const parseManualInput = useCallback(() => {
    try {
      let privateKeyNumbers: number[];
      
      if (manualFormat === 'hex') {
        // Remove 0x prefix if present and parse hex string
        const cleanHex = manualInput.replace(/^0x/, '');
        if (cleanHex.length !== 64) {
          throw new Error('Hex string must be 64 characters (32 bytes)');
        }
        privateKeyNumbers = [];
        for (let i = 0; i < cleanHex.length; i += 2) {
          privateKeyNumbers.push(parseInt(cleanHex.substr(i, 2), 16));
        }
      } else {
        // Parse array format like [0x57, 0x6e, ...] or [87, 110, ...]
        const arrayMatch = manualInput.match(/\[(.*)\]/);
        if (!arrayMatch) {
          throw new Error('Array format must be like [0x57, 0x6e, ...] or [87, 110, ...]');
        }
        const elements = arrayMatch[1].split(',').map(s => s.trim());
        privateKeyNumbers = elements.map(elem => {
          if (elem.startsWith('0x')) {
            return parseInt(elem, 16);
          } else {
            return parseInt(elem, 10);
          }
        });
      }

      if (privateKeyNumbers.length !== 32) {
        throw new Error('Private key must be 32 bytes');
      }

      onIssuerSkChange(privateKeyNumbers);
      generateJwkFromSk(privateKeyNumbers);
    } catch (error) {
      alert(`${t.invalidPrivateKey}: ${error}`);
    }
  }, [manualFormat, manualInput, onIssuerSkChange, generateJwkFromSk, t]);

  const generateRandomKey = useCallback(() => {
    const keyPair = genKey();
    const privateKeyNumbers = keyPair.privateKey.map(hex => parseInt(hex, 16));
    onIssuerSkChange(privateKeyNumbers);
    generateJwkFromSk(privateKeyNumbers);
  }, [onIssuerSkChange, generateJwkFromSk]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jwk);
      setCopyMessage(t.copied);
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = jwk;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyMessage(t.copied);
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  // Set default issuer secret key on component mount
  useEffect(() => {
    if (issuerSk.length === 0) {
      parseManualInput();
    }
  }, [issuerSk.length, parseManualInput]);

  return (
    <div className="section">
      <h2>{t.issuerKeySection}</h2>
      
      <div className="mode-selector">
        <label>
          <input
            type="radio"
            value="manual"
            checked={mode === 'manual'}
            onChange={(e) => setMode(e.target.value as KeyInputMode)}
          />
          {t.manualKeyInput}
        </label>
        <label>
          <input
            type="radio"
            value="random"
            checked={mode === 'random'}
            onChange={(e) => setMode(e.target.value as KeyInputMode)}
          />
          {t.generateRandomKey}
        </label>
      </div>

      {mode === 'random' && (
        <div className="random-key-section">
          <button onClick={generateRandomKey} className="generate-button">
            {t.generateJwk}
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="manual-key-section">
          <div className="format-selector">
            <label>
              <input
                type="radio"
                value="hex"
                checked={manualFormat === 'hex'}
                onChange={(e) => setManualFormat(e.target.value as ManualInputFormat)}
              />
              {t.hexStringFormat}
            </label>
            <label>
              <input
                type="radio"
                value="array"
                checked={manualFormat === 'array'}
                onChange={(e) => setManualFormat(e.target.value as ManualInputFormat)}
              />
              {t.numberArrayFormat}
            </label>
          </div>
          
          <div className="input-section">
            <label>{t.privateKeyInput}:</label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={
                manualFormat === 'hex' 
                  ? '576e3f0b4ddb56634...' 
                  : '[0x57, 0x6e, 0x3f, 0x0b, ...]'
              }
              rows={2}
              className="json-input"
            />
            <button onClick={parseManualInput} className="parse-button">
              {t.generateJwk}
            </button>
          </div>
        </div>
      )}

      {jwk && (
        <div className="jwk-display">
          <label>{t.jwkDisplay}:</label>
          <pre className="jwk-output" style={{ 
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            {jwk}
            <button 
              onClick={copyToClipboard} 
              className="copy-icon-button"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={t.copyToClipboard}
            >
              📋
            </button>
            {copyMessage && (
              <span className="copy-message" style={{ position: 'absolute', top: '10px', right: '50px' }}>
                {copyMessage}
              </span>
            )}
          </pre>
        </div>
      )}

    </div>
  );
};

export default IssuerKeySection;
