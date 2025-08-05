import { useState, useEffect } from 'react';
import './App.css';
import IssuerKeySection from './components/IssuerKeySection';
import HeaderSection from './components/HeaderSection';
import UserPkSection from './components/UserPkSection';
import PayloadSection from './components/PayloadSection';
import ResultSection from './components/ResultSection';
import { issueJwp } from './utils/sign';
import { type Language, getTranslations } from './utils/i18n';

export interface PayloadPair {
  path: string;
  value: string | number;
}

function App() {
  const defaultIss = `${window.location.origin}${window.location.pathname}`;
  const [language, setLanguage] = useState<Language>('ja');
  const [issuerSk, setIssuerSk] = useState<number[]>([]);
  const [header, setHeader] = useState<string>(
    JSON.stringify({
      alg: 'DENYM-ES256',
      typ: 'JPT',
      iss: defaultIss,
      kid: '1'
    }));
  const [userPk, setUserPk] = useState<string>('');
  const [iat, setIat] = useState<number>(Math.floor(Date.now() / 1000));
  const [exp, setExp] = useState<number>(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365); // 1 year expiration
  const [disclosablePayloadPairs, setDisclosablePayloadPairs] = useState<PayloadPair[]>([
    { path: '/given_name', value: '太郎' },
    { path: '/family_name', value: '山田' },
    { path: '/email', value: 'taro@example.com' }
  ]);
  const [jwpResult, setJwpResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const t = getTranslations(language);

  const handleGenerateJwp = async () => {
    if (!issuerSk.length || !header || !userPk || !disclosablePayloadPairs.length) {
      alert(t.fillAllFields);
      return;
    }

    setIsGenerating(true);
    try {
      const disclosablePayloads: [string, string | number][] = disclosablePayloadPairs.map(pair => [pair.path, pair.value]);
      const result = await issueJwp(issuerSk, header, userPk, iat, exp, disclosablePayloads);
      setJwpResult(result);
    } catch (error) {
      console.error('JWP generation error:', error);
      alert(t.jwpGenerationError);
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically generate JWP when all required fields are available
  useEffect(() => {
    if (issuerSk.length && header && userPk && disclosablePayloadPairs.length && !jwpResult) {
      handleGenerateJwp();
    }
  }, [issuerSk, header, userPk, disclosablePayloadPairs, jwpResult]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="title-section">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="language-selector">
            <label>{t.language}: </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="language-select"
            >
              <option value="ja">{t.japanese}</option>
              <option value="en">{t.english}</option>
            </select>
          </div>
        </div>
      </header>

      <main className="App-main">
        <div className="sections-container">
          <IssuerKeySection
            issuerSk={issuerSk}
            onIssuerSkChange={setIssuerSk}
            t={t}
          />

          <UserPkSection
            userPk={userPk}
            onUserPkChange={setUserPk}
            header={header}
            t={t}
          />

          <HeaderSection
            header={header}
            onHeaderChange={setHeader}
            t={t}
          />

          <PayloadSection
            pairs={disclosablePayloadPairs}
            onPairsChange={setDisclosablePayloadPairs}
            header={header}
            iat={iat}
            onIatChange={setIat}
            exp={exp}
            onExpChange={setExp}
            t={t}
          />

          <div className="generate-section">
            <button
              onClick={handleGenerateJwp}
              disabled={isGenerating}
              className="generate-button"
            >
              {isGenerating ? t.generating : t.generateJwp}
            </button>
          </div>

          <ResultSection
            jwpResult={jwpResult}
            t={t}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
