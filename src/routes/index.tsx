// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import InitialIcons from '@/components/template/InitialIcons'
import AgeVerification from '@/components/AgeVerification'
import { Camera, Video, Image, Users, ChevronRight, Play } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const storedData = localStorage.getItem('ageVerification')
    if (storedData) {
      try {
        const verificationData = JSON.parse(storedData)
        const isValid = Date.now() - verificationData.timestamp < 30 * 24 * 60 * 60 * 1000
        setIsVerified(verificationData.isVerified && isValid)
      } catch (error) {
        console.error('Error parsing verification data:', error)
        setIsVerified(false)
      }
    } else {
      setIsVerified(false)
    }
  }, [])

  const features = [
    {
      to: '/camviewer',
      icon: <Camera size={18} />,
      title: 'Cam Viewer',
      description: 'Multi-stream viewer',
    },
    {
      to: '/redgifs',
      icon: <Video size={18} />,
      title: 'RedGifs',
      description: 'Adult content',
    },
    {
      to: '/wallheaven',
      icon: <Image size={18} />,
      title: 'Wallheaven',
      description: 'High-quality wallpapers',
    },
    {
      to: '/coomerKemono',
      icon: <Users size={18} />,
      title: 'CoomerKemono',
      description: 'Artist collections',
    },
    {
      to: "/fapello",
      icon: <Image size={18} />,
      title: 'Fapello',
      description: 'Adult content',
    },
    {
      to: "/javtube",
      icon: <Video color="red" size={18} />,
      title: 'Javtube',
      description: 'Adult content',
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const item = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  }

  if (isVerified === false) return <AgeVerification onVerified={() => setIsVerified(true)} />
  if (isVerified === null)
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Verifying age...</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 py-16"
      >
        {/* Header */}
        <motion.div variants={item} className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <InitialIcons />
          </div>
          <h1 className="text-4xl font-semibold mb-2 tracking-tight">
            <span className="text-white">Coomer</span>
            <span className="text-purple-400">Labs</span>
          </h1>
          <p className="text-gray-400 text-sm">Your content management platform</p>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {features.map((f) => (
            <Link key={f.to} to={f.to}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-700/50 text-purple-400">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-medium">{f.title}</h3>
                </div>
                <p className="text-gray-400 text-sm">{f.description}</p>
                <div className="flex justify-end mt-3 text-gray-500 group-hover:text-purple-300">
                  <ChevronRight size={16} />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Get Started */}
        <motion.div variants={item} className="text-center">
          <Link to="/camviewer">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors font-medium flex items-center gap-2 mx-auto"
            >
              <Play size={18} />
              <span>Get Started</span>
            </motion.button>
          </Link>

          <p className="text-gray-500 text-sm mt-6">
            <span className="text-green-400 mr-1">\u2713</span> Age verified \u2014 Premium experience
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
