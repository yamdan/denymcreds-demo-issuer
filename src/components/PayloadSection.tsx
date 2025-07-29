import React, { useState, useEffect } from 'react';
import { applyJsonPatch, parseValue, type JsonValue } from '../utils/json-patch';
import { type PayloadPair } from '../App';
import { type Translations } from '../utils/i18n';

interface Props {
  pairs: PayloadPair[];
  onPairsChange: (pairs: PayloadPair[]) => void;
  header: string;
  iat: number;
  onIatChange: (iat: number) => void;
  exp: number;
  onExpChange: (exp: number) => void;
  t: Translations;
}

const PayloadSection: React.FC<Props> = ({ pairs, onPairsChange, header, iat, onIatChange, exp, onExpChange, t }) => {
  const [patchedJson, setPatchedJson] = useState<string>('');

  useEffect(() => {
    updatePatchedJson();
  }, [pairs, header, iat, exp]);

  const updatePatchedJson = () => {
    try {
      const headerObj = JSON.parse(header);
      const iatAndExp: [string, JsonValue][] = [["/iat", iat], ["/exp", exp]];
      const patchPairs: [string, JsonValue][] = pairs.map(pair => [pair.path, pair.value]);
      const payloads = iatAndExp.concat(patchPairs);
      const patched = applyJsonPatch(headerObj, payloads);
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

  const updateIat = (value: string) => {
    const newIat = parseValue(value);
    if (typeof newIat === 'number') {
      onIatChange(newIat);
    } else {
      alert(t.invalidIat);
    }
  };

  const updateExp = (value: string) => {
    const newExp = parseValue(value);
    if (typeof newExp === 'number') {
      onExpChange(newExp);
    } else {
      alert(t.invalidExp);
    }
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
            <div key="iat" className="pair-row">
              <div className="pair-inputs">
                <div className="input-group">
                  <label>{t.path}:</label>
                  <input
                    type="text"
                    value="/iat"
                    readOnly
                    className="readonly-input"
                  />
                </div>
                <div className="input-group">
                  <label>{t.value}:</label>
                  <input
                    type="text"
                    value={iat}
                    onChange={(e) => updateIat(e.target.value)}
                    placeholder="例: 1633036800"
                  />
                </div>
              </div>
            </div>
            <div key="exp" className="pair-row">
              <div className="pair-inputs">
                <div className="input-group">
                  <label>{t.path}:</label>
                  <input
                    type="text"
                    value="/exp"
                    readOnly
                    className="readonly-input"
                  />
                </div>
                <div className="input-group">
                  <label>{t.value}:</label>
                  <input
                    type="text"
                    value={exp}
                    onChange={(e) => updateExp(e.target.value)}
                    placeholder="例: 1664572800"
                  />
                </div>
              </div>
            </div>

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
