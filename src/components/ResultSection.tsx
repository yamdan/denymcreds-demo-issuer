import React, { useState } from 'react';
import { type Translations } from '../utils/i18n';

interface Props {
  jwpResult: string;
  t: Translations;
}

const ResultSection: React.FC<Props> = ({ jwpResult, t }) => {
  const [copyMessage, setCopyMessage] = useState<string>('');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jwpResult);
      setCopyMessage(t.copied);
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = jwpResult;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyMessage(t.copied);
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  return (
    <div className="section">
      <h2>{t.resultSection}</h2>
      
      {jwpResult ? (
        <div className="result-container">
          <div className="result-display" style={{ 
            width: '100%', 
            position: 'relative',
            display: 'block' /* Override grid layout */
          }}>
            <div className="jwp-raw" style={{ width: '100%' }}>
              <pre className="jwp-output" style={{ 
                width: '100%', 
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                {jwpResult}
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
              </pre>
              {copyMessage && (
                <span className="copy-message" style={{ position: 'absolute', top: '10px', right: '45px' }}>
                  {copyMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-result">
          <p>JWP結果がここに表示されます</p>
        </div>
      )}
    </div>
  );
};

export default ResultSection;
