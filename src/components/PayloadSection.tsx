import React, { useState, useEffect } from 'react';
import { applyJsonPatch } from '../utils/json-patch';
import { type PayloadPair } from '../App';
import { type Translations } from '../utils/i18n';

interface Props {
  pairs: PayloadPair[];
  onPairsChange: (pairs: PayloadPair[]) => void;
  header: string;
  t: Translations;
}

const PayloadSection: React.FC<Props> = ({ pairs, onPairsChange, header, t }) => {
  const [patchedJson, setPatchedJson] = useState<string>('');

  useEffect(() => {
    updatePatchedJson();
  }, [pairs, header]);

  const updatePatchedJson = () => {
    try {
      const headerObj = JSON.parse(header);
      const patchPairs: [string, string | number][] = pairs.map(pair => [pair.path, pair.value]);
      const patched = applyJsonPatch(headerObj, patchPairs);
      setPatchedJson(JSON.stringify(patched, null, 2));
    } catch (error) {
      setPatchedJson(`Error: ${error}`);
    }
  };

  const addPair = () => {
    const newPairs = [...pairs, { path: '', value: '' }];
    onPairsChange(newPairs);
  };

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    onPairsChange(newPairs);
  };

  const updatePair = (index: number, field: 'path' | 'value', value: string | number) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onPairsChange(newPairs);
  };

  const parseValue = (value: string): string | number => {
    // Try to parse as number if it looks like a number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    return value;
  };

  return (
    <div className="section">
      <h2>{t.payloadSection}</h2>
      
      <div className="payload-container">
        <div className="payload-input">
          <div className="pairs-list">
            {pairs.map((pair, index) => (
              <div key={index} className="pair-row">
                <div className="pair-inputs">
                  <div className="input-group">
                    <label>{t.path}:</label>
                    <input
                      type="text"
                      value={pair.path}
                      onChange={(e) => updatePair(index, 'path', e.target.value)}
                      placeholder="/given_name"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>{t.value}:</label>
                    <input
                      type="text"
                      value={pair.value.toString()}
                      onChange={(e) => updatePair(index, 'value', parseValue(e.target.value))}
                      placeholder="太郎"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => removePair(index)}
                  className="remove-button"
                  disabled={pairs.length <= 1}
                >
                  {t.removePair}
                </button>
              </div>
            ))}
          </div>
          
          <button onClick={addPair} className="add-button">
            {t.addPair}
          </button>
        </div>

        <div className="json-patch-preview">
          <h3>{t.jsonPatchPreview}</h3>
          <div className="patch-display">
            <pre className="patched-json">{patchedJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayloadSection;
