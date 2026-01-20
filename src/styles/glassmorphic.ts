// Shared Glassmorphic Liquid Glass Styles for All Apps
export const glassmorphicStyles = `
  /* Base Glassmorphic Styles */
  .glass {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .glass-dark {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(20, 20, 20, 0.2) 50%,
      rgba(0, 0, 0, 0.3) 100%
    );
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Frosted Glass Effect */
  .frosted {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .frosted-dark {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(60px) saturate(200%);
    -webkit-backdrop-filter: blur(60px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Liquid Card */
  .liquid-card {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .liquid-card-dark {
    background: linear-gradient(
      135deg,
      rgba(40, 40, 50, 0.6) 0%,
      rgba(30, 30, 40, 0.4) 50%,
      rgba(20, 20, 30, 0.5) 100%
    );
    backdrop-filter: blur(50px) saturate(200%);
    -webkit-backdrop-filter: blur(50px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .liquid-card:hover,
  .liquid-card-dark:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.25);
  }

  /* Liquid Button */
  .liquid-button {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.1) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .liquid-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.5s;
  }

  .liquid-button:hover::before {
    left: 100%;
  }

  .liquid-button:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  /* Liquid Modal */
  .liquid-modal {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    backdrop-filter: blur(50px) saturate(200%);
    -webkit-backdrop-filter: blur(50px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  /* Liquid Input */
  .liquid-input {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .liquid-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  /* Glass Panel */
  .glass-panel {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  }

  /* Glass Header */
  .glass-header {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Scrollbar */
  .glass-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .glass-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  .glass-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0.2) 100%
    );
    border-radius: 10px;
    border: 2px solid rgba(0, 0, 0, 0.05);
  }

  .glass-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.3) 100%
    );
  }

  /* Animations */
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  .pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .float {
    animation: float 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* Spring Animation */
  .spring-enter {
    animation: spring-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes spring-in {
    0% {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    50% {
      transform: scale(1.02) translateY(-5px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Glow Effect */
  .glow-cyan {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
  }

  .glow-pink {
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
  }

  .glow-purple {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
  }

  /* Gradient Orbs */
  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    animation: float-orb 6s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes float-orb {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg);
    }
    33% {
      transform: translate(30px, -30px) rotate(120deg);
    }
    66% {
      transform: translate(-20px, 20px) rotate(240deg);
    }
  }
`;
