import React, { useState, useEffect } from 'react';
import { applyJsonPatch, parseValue, type JsonValue } from '../utils/json-patch';
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
      const patchPairs: [string, JsonValue][] = pairs.map(pair => [pair.path, pair.value]);
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

  const updatePair = (index: number, field: 'path' | 'value', value: string) => {
    const newPairs = [...pairs];
    if (field === 'value') {
      // 値の場合は parseValue を使用して適切な型に変換
      newPairs[index] = { ...newPairs[index], [field]: parseValue(value) };
    } else {
      newPairs[index] = { ...newPairs[index], [field]: value };
    }
    onPairsChange(newPairs);
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
                      value={typeof pair.value === 'object' && pair.value !== null
                        ? JSON.stringify(pair.value)
                        : String(pair.value ?? '')
                      }
                      onChange={(e) => updatePair(index, 'value', e.target.value)}
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
