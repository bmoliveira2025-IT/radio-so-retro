import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import './SignUpView.css';

interface SignUpViewProps {
  onLogin: () => void;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onLogin();
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="logo-container">
          <PlayCircle size={48} color="var(--primary-color)" strokeWidth={1.5} />
        </div>
        
        <h1 className="signup-title">Entrar</h1>
        <p className="signup-subtitle">para começar a ouvir</p>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label>Número de Telefone</label>
            <input 
              type="tel" 
              placeholder="Seu número" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="neon-input"
            />
          </div>
          <button type="submit" className="hidden-submit">Start</button>
        </form>
      </div>
    </div>
  );
};

export default SignUpView;
