// src/components/AgeVerification.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, AlertCircle, Shield, Calendar, Lock, ExternalLink, FileText, Info, AlertTriangle } from 'lucide-react';

interface VerificationData {
    isVerified: boolean;
    timestamp: number;
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
}

const AgeVerification = ({ onVerified }: { onVerified: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState('');
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Check if user is already verified
    useEffect(() => {
        const storedData = localStorage.getItem('ageVerification');
        if (storedData) {
            try {
                const verificationData: VerificationData = JSON.parse(storedData);
                // Verification is valid for 30 days
                const isValid = Date.now() - verificationData.timestamp < 30 * 24 * 60 * 60 * 1000;

                if (verificationData.isVerified && isValid) {
                    onVerified();
                }
            } catch (error) {
                console.error('Error parsing verification data:', error);
            }
        }
    }, [onVerified]);

    const questions = [
        {
            id: 1,
            question: "What is your age range?",
            icon: <Calendar size={20} />,
            options: [
                { value: "under18", label: "Under 18" },
                { value: "18-24", label: "18-24" },
                { value: "25-34", label: "25-34" },
                { value: "35-44", label: "35-44" },
                { value: "45+", label: "45+" }
            ]
        },
        {
            id: 2,
            question: "Do you understand that this platform contains adult content?",
            icon: <AlertCircle size={20} />,
            options: [
                { value: "yes", label: "Yes, I understand" },
                { value: "no", label: "No, I was not aware" }
            ]
        },
        {
            id: 3,
            question: "Are you of legal age to view adult content in your jurisdiction?",
            icon: <Shield size={20} />,
            options: [
                { value: "yes", label: "Yes, I am of legal age" },
                { value: "no", label: "No, I am not of legal age" },
                { value: "unsure", label: "I'm not sure about local laws" }
            ]
        },
        {
            id: 4,
            question: "Do you consent to viewing explicit content?",
            icon: <Lock size={20} />,
            options: [
                { value: "yes", label: "Yes, I consent" },
                { value: "no", label: "No, I do not consent" }
            ]
        },
        {
            id: 5,
            question: "Have you read and agreed to our Terms of Service and Privacy Policy?",
            icon: <FileText size={20} />,
            options: [
                { value: "yes", label: "Yes, I have read and agree" },
                { value: "no", label: "No, I have not read them" }
            ]
        }
    ];

    const handleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentStep]: value }));
        setError('');
    };

    const handleNext = () => {
        if (!answers[currentStep]) {
            setError('Please select an option to continue');
            return;
        }

        // Check if answer disqualifies user
        if (
            answers[currentStep] === 'under18' ||
            answers[currentStep] === 'no' && (currentStep === 2 || currentStep === 4)
        ) {
            setError('Unfortunately, you cannot access this content based on your answers.');
            return;
        }

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Check if terms and privacy have been agreed to
            if (!agreedToTerms || !agreedToPrivacy) {
                setError('You must agree to both Terms of Service and Privacy Policy to continue.');
                return;
            }
            completeVerification();
        }
    };

    const completeVerification = () => {
        const verificationData: VerificationData = {
            isVerified: true,
            timestamp: Date.now(),
            agreedToTerms,
            agreedToPrivacy
        };

        localStorage.setItem('ageVerification', JSON.stringify(verificationData));
        setIsComplete(true);

        setTimeout(() => {
            onVerified();
        }, 1500);
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setError('');
        }
    };

    const progressPercentage = ((currentStep + 1) / questions.length) * 100;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md mx-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                    <Shield size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Age Verification</h2>
                                    <p className="text-sm text-gray-400">Step {currentStep + 1} of {questions.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-purple-400">
                                        {questions[currentStep].icon}
                                    </div>
                                    <h3 className="text-lg font-medium text-white">{questions[currentStep].question}</h3>
                                </div>

                                <div className="space-y-3">
                                    {questions[currentStep].options.map((option) => (
                                        <motion.button
                                            key={option.value}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAnswer(option.value)}
                                            className={`w-full p-3 rounded-lg border transition-all ${answers[currentStep] === option.value
                                                    ? 'border-purple-500 bg-purple-500/20 text-white'
                                                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-left">{option.label}</span>
                                                {answers[currentStep] === option.value && (
                                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Terms and Privacy Agreement for Step 5 */}
                                {currentStep === 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                                    >
                                        <h4 className="text-sm font-medium text-white mb-3">Legal Agreement Required</h4>

                                        <div className="space-y-3">
                                            <label className="flex items-start space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={agreedToTerms}
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                    className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                                />
                                                <div className="text-sm">
                                                    <span className="text-gray-300">I have read and agree to the</span>
                                                    <button
                                                        onClick={() => setShowTermsModal(true)}
                                                        className="text-purple-400 hover:text-purple-300 underline ml-1 flex items-center"
                                                    >
                                                        Terms of Service
                                                        <ExternalLink size={12} className="ml-1" />
                                                    </button>
                                                </div>
                                            </label>

                                            <label className="flex items-start space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={agreedToPrivacy}
                                                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                                    className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                                />
                                                <div className="text-sm">
                                                    <span className="text-gray-300">I have read and agree to the</span>
                                                    <button
                                                        onClick={() => setShowPrivacyModal(true)}
                                                        className="text-purple-400 hover:text-purple-300 underline ml-1 flex items-center"
                                                    >
                                                        Privacy Policy
                                                        <ExternalLink size={12} className="ml-1" />
                                                    </button>
                                                </div>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start space-x-2"
                                    >
                                        <AlertCircle size={18} className="text-red-400 mt-0.5" />
                                        <p className="text-sm text-red-300">{error}</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-800 flex justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${currentStep === 0
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            Previous
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2"
                        >
                            {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Terms of Service Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        onClick={() => setShowTermsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-800">
                                <h3 className="text-xl font-semibold text-white flex items-center">
                                    <FileText size={20} className="mr-2 text-purple-400" />
                                    Terms of Service
                                </h3>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-300 text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">1. Acceptance of Terms</h4>
                                        <p>By accessing and using CoomerLabs, you accept and agree to be bound by these Terms of Service.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">2. Age Verification</h4>
                                        <p>You must be at least 18 years of age or the legal age of majority in your jurisdiction to use this service.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">3. Content Disclaimer</h4>
                                        <p>CoomerLabs does not host, own, or distribute any content. We are a tool that allows users to view third-party content from external sources. All content remains the property of their respective owners.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">4. User Responsibility</h4>
                                        <p>You are solely responsible for your use of the service and for ensuring compliance with applicable laws in your jurisdiction.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">5. Limitation of Liability</h4>
                                        <p>CoomerLabs is not liable for any content accessed through our service. We do not endorse, guarantee, or assume responsibility for any third-party content.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">6. Legal Compliance</h4>
                                        <p>These terms are drafted with legal precision and are intended to be legally binding. By agreeing to these terms, you acknowledge that you have read, understood, and consent to be bound by them.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-800 flex justify-end">
                                <button
                                    onClick={() => setShowTermsModal(false)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                >
                                    I Understand
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Privacy Policy Modal */}
            <AnimatePresence>
                {showPrivacyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        onClick={() => setShowPrivacyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-800">
                                <h3 className="text-xl font-semibold text-white flex items-center">
                                    <Shield size={20} className="mr-2 text-purple-400" />
                                    Privacy Policy
                                </h3>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-300 text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Information We Collect</h4>
                                        <p>We collect only the minimum information necessary to provide our service, including verification status and usage preferences.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">How We Use Information</h4>
                                        <p>Your information is used solely to provide and improve our services. We do not sell, rent, or lease your personal information to third parties.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">Data Security</h4>
                                        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">Third-Party Content</h4>
                                        <p>We do not control, endorse, or assume responsibility for any third-party content accessed through our service. Your interaction with such content is subject to the terms and privacy policies of those third parties.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">Legal Compliance</h4>
                                        <p>This privacy policy is designed with legal precision to comply with applicable privacy laws and regulations. By using our service, you acknowledge that you have read and understood this policy.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-800 flex justify-end">
                                <button
                                    onClick={() => setShowPrivacyModal(false)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                >
                                    I Understand
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success State */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
                    >
                        <div className="w-full max-w-md mx-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-2">Verification Complete</h2>
                            <p className="text-gray-400 mb-6">You now have access to all features</p>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-6">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1 }}
                                />
                                {/* Legal Disclaimer Section */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-10"
                                >
                                    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
                                        <div className="flex items-start space-x-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                                <AlertTriangle size={20} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-white mb-1">Important Legal Disclaimer</h3>
                                                <p className="text-sm text-gray-400">Please read carefully before proceeding</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-sm text-gray-300">
                                            <p className="flex items-start">
                                                <span className="text-yellow-500 mr-2 flex-shrink-0">•</span>
                                                <span><strong>CoomerLabs does not host, own, or distribute any content.</strong> We are a tool that allows users to view third-party content from external sources.</span>
                                            </p>
                                            <p className="flex items-start">
                                                <span className="text-yellow-500 mr-2 flex-shrink-0">•</span>
                                                <span><strong>All content remains the property of their respective owners.</strong> We do not claim ownership or endorse any content accessed through our platform.</span>
                                            </p>
                                            <p className="flex items-start">
                                                <span className="text-yellow-500 mr-2 flex-shrink-0">•</span>
                                                <span><strong>This platform is provided with legal and professional accuracy.</strong> Our terms and privacy policy are drafted with lawyer-like precision to ensure legal compliance and user protection.</span>
                                            </p>
                                            <p className="flex items-start">
                                                <span className="text-yellow-500 mr-2 flex-shrink-0">•</span>
                                                <span><strong>Users are solely responsible for their use of the service.</strong> You must ensure compliance with applicable laws in your jurisdiction.</span>
                                            </p>
                                        </div>

                                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <p className="text-xs text-yellow-200 text-center">
                                                By continuing to use this platform, you acknowledge that you have read, understood, and agreed to these terms.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AgeVerification;