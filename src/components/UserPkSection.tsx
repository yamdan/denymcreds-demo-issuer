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
  const [devicePk, setDevicePk] = useState<string>('0x04421b4d7531a4adad4d1d2215af6a35fb6c509c9f54eab216ec6bd2420aff0e76e04f5676847feff5748a47b07b9e5bb3963df79c5d1cb41ab2aed04c0d9ef5a6');
  const [context, setContext] = useState<string>('https://issuer.example');

  const userPkJwk = userPk ? JSON.stringify({
    kty: 'oct',
    k: userPk,
  }, null, 2) : '';

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
      const pkHex = devicePk.startsWith('0x04') ? devicePk.slice(4) : devicePk.replace(/^0x/, '');
      const devicePkX = pkHex.slice(0, 64);
      const devicePkY = pkHex.slice(64, 128);
      // Parse device public key
      const devicePkParsed: PublicKey = {
        x: parseHexToNumberArray(devicePkX),
        y: parseHexToNumberArray(devicePkY)
      };

      // Generate user public key
      const result = genUpk(userSk, devicePkParsed, context);

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

        <div className="input-group">
          <label>{t.devicePk}:</label>
          <input
            type="text"
            value={devicePk}
            onChange={(e) => setDevicePk(e.target.value)}
            placeholder="0x04421b4d7531a4adad4d1d2215af6a35fb6c509c9f54eab216ec6bd2420aff0e76e04f5676847feff5748a47b07b9e5bb3963df79c5d1cb41ab2aed04c0d9ef5a6"
          />
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
          <pre className="userpk-output">{userPkJwk}</pre>
        </div>
      )}
    </div>
  );
};

export default UserPkSection;
