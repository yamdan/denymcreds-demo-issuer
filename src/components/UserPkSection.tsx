import React, { useState, useEffect } from 'react';
import { genUpk, genUsk, base64urlEncode, type PublicKey } from '../utils/sign';
import { type Translations } from '../utils/i18n';

interface Props {
  userPk: string;
  onUserPkChange: (userPk: string) => void;
  t: Translations;
}

const UserPkSection: React.FC<Props> = ({ userPk, onUserPkChange, t }) => {
  const [userSk, setUserSk] = useState<string>('0x0a5bce2449b1632f3d1e4f96c095baa811040e17e7a7e84fb5ce8a0cad76f0e6');
  const [devicePkX, setDevicePkX] = useState<string>('0x421b4d7531a4adad4d1d2215af6a35fb6c509c9f54eab216ec6bd2420aff0e76');
  const [devicePkY, setDevicePkY] = useState<string>('0xe04f5676847feff5748a47b07b9e5bb3963df79c5d1cb41ab2aed04c0d9ef5a6');
  const [context, setContext] = useState<string>('https://issuer.example');

  const generateRandomUserSk = () => {
    const randomSk = genUsk();
    const skHex = `0x${randomSk.toString(16).padStart(64, '0')}`;
    setUserSk(skHex);
  };

  const parseHexToNumberArray = (hexString: string): number[] => {
    const cleanHex = hexString.replace(/^0x/, '');
    if (cleanHex.length !== 64) {
      throw new Error('Hex string must be 64 characters (32 bytes)');
    }
    const numbers: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      numbers.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    return numbers;
  };

  const generateUserPk = () => {
    try {
      // Parse device public key
      const devicePk: PublicKey = {
        x: parseHexToNumberArray(devicePkX),
        y: parseHexToNumberArray(devicePkY)
      };

      // Generate user public key
      const result = genUpk(userSk, devicePk, context);
      
      // Convert to base64url format
      const userPkHex = result.userPk.toString(16).padStart(64, '0');
      const userPkBytes = new Uint8Array(userPkHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const userPkB64 = base64urlEncode(userPkBytes);
      
      onUserPkChange(userPkB64);
    } catch (error) {
      alert(`Error generating user PK: ${error}`);
    }
  };

  // Automatically generate user PK when component mounts
  useEffect(() => {
    generateUserPk();
  }, []);

  return (
    <div className="section">
      <h2>{t.userPkSection}</h2>
      
      <div className="section-content">
        <div className="input-group">
          <label>{t.userSk}:</label>
          <div className="input-with-button">
            <input
              type="text"
              value={userSk}
              onChange={(e) => setUserSk(e.target.value)}
              placeholder="0x0a5bce2449b1632f3d1e4f96c095baa811040e17e7a7e84fb5ce8a0cad76f0e6"
            />
            <button onClick={generateRandomUserSk} className="small-button">
              Random
            </button>
          </div>
        </div>

        <div className="device-pk-container">
          <h3>{t.devicePk}</h3>
          <div className="device-pk-inputs">
            <div className="input-group">
              <label>{t.devicePkX}:</label>
              <input
                type="text"
                value={devicePkX}
                onChange={(e) => setDevicePkX(e.target.value)}
                placeholder="0x421b4d7531a4adad4d1d2215af6a35fb6c509c9f54eab216ec6bd2420aff0e76"
              />
            </div>

            <div className="input-group">
              <label>{t.devicePkY}:</label>
              <input
                type="text"
                value={devicePkY}
                onChange={(e) => setDevicePkY(e.target.value)}
                placeholder="0xe04f5676847feff5748a47b07b9e5bb3963df79c5d1cb41ab2aed04c0d9ef5a6"
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>{t.context}:</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="https://issuer.example"
          />
        </div>
      </div>

      <div className="generate-section">
        <button onClick={generateUserPk} className="generate-button">
          {t.generateUserPk}
        </button>
      </div>

      {userPk && (
        <div className="current-userpk">
          <label>{t.currentUserPk}:</label>
          <pre className="userpk-output">{userPk}</pre>
        </div>
      )}
    </div>
  );
};

export default UserPkSection;
