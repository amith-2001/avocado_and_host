'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Loader2, Mic, ChevronRight, Sparkles, X, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from 'framer-motion'

const topicSuggestions = [
  "Climate Change",
  "Artificial Intelligence",
  "Space Exploration",
  "Cryptocurrency",
  "Mental Health",
  "Sustainable Living"
]

export default function PodcastGenerator() {
  const [audioError, setAudioError] = useState(null)
  const [audioFilename, setAudioFilename] = useState('');
  const [step, setStep] = useState(0)
  const [selectedHosts, setSelectedHosts] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPodcastGenerated, setIsPodcastGenerated] = useState(false)
  const [volume, setVolume] = useState(50)
  const [podcastFormat, setPodcastFormat] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const { toast } = useToast()
  const [previewingHost, setPreviewingHost] = useState(null)
  const previewAudioRef = useRef(null)

  const hosts = [
    {
      name: "Jessica",
      style: "Analytical & Storyteller",
      stillImage: "/JessicaSTILL.png",
      gifImage: "/JessicaGIF.gif",
      character:"1"
    },
    {
      name: "Allison",
      style: "Casual & Entertaining",
      stillImage: "/AllisonSTILL.png",
      gifImage: "/AllisonGIF.gif",
      character:"2"
    },
    {
      name: "Andrew",
      style: "Deep Dive & Investigative",
      stillImage: "/AndrewSTILL.png",
      gifImage: "/AndrewGIF.gif",
      character:"3"
    }
  ]

  const duoHosts = [
    {
      name: "Alex",
      style: "Conversational & Engaging",
      stillImage: "/AlexSTILL.png",
      gifImage: "/AlexGIF.gif"
    },
    {
      name: "Jamie",
      style: "Insightful & Analytical",
      stillImage: "/JamieSTILL.png",
      gifImage: "/JamieGIF.gif"
    }
  ]

  const getHostInfo = (index) => {
    if (podcastFormat === 'single') {
      return hosts[index];
    } else {
      return duoHosts[index - 3];
    }
  }

  const resetPodcastState = () => {
    setTopic('');
    setStep(1);
    setPodcastFormat(null);
    setSelectedHosts([]);
    setIsPodcastGenerated(false);
    setAudioUrl('');
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleStartGenerate = () => {
    setStep(1)
  }

  const handleTopicSubmit = (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic before proceeding.",
        variant: "destructive",
      })
      return
    }
    setStep(2)
  }

  const handleFormatSelect = (format) => {
    setPodcastFormat(format);
    setSelectedHosts([]);
    setStep(3);
  }

  const handleHostSelect = (index) => {
    if (podcastFormat === 'single') {
      setSelectedHosts([index]);
    } else if (podcastFormat === 'duo') {
      setSelectedHosts([3, 4]); // Indices for Alex and Jamie
    }
  }

  const handleHostConfirm = () => {
    if (podcastFormat === 'single' && selectedHosts.length !== 1) {
      toast({
        title: "Error",
        description: "Please select a host before proceeding.",
        variant: "destructive",
      })
      return;
    }
    if (podcastFormat === 'duo' && selectedHosts.length !== 2) {
      toast({
        title: "Error",
        description: "Please select the duo hosts before proceeding.",
        variant: "destructive",
      })
      return;
    }
    setStep(4);
  }

const handleGenerate = async () => {
  setIsGenerating(true);
  setAudioError(null);
  console.log("Starting podcast generation process");

  try {
    let response;
    if (podcastFormat === 'single') {
      const hostInfo = getHostInfo(selectedHosts[0]);
      const character = hostInfo.character || '0';
      console.log(`Generating single-host podcast with character: ${character}`);
      response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/one_person',
          topic,
          character,
        }),
      });
    } else {
      console.log("Generating two-host podcast");
      response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/two_person',
          topic,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Podcast generation response:", data);

    const filename = data.filename || 'generated_podcast.mp3';
    setAudioFilename(filename);
    setAudioUrl(`/api/audio/${filename}`);
    
    setIsGenerating(false);
    setIsPodcastGenerated(true);
    setStep(5);
    
    toast({
      title: "Success",
      description: "Your podcast has been generated!",
    });

    // Empty the database after retrieval
    console.log("Emptying database");
    await fetch('/api/empty-database', { method: 'POST' });

  } catch (error) {
    console.error('Error generating podcast:', error);
    toast({
      title: "Error",
      description: "Failed to generate podcast. Please try again.",
      variant: "destructive",
    });
    setIsGenerating(false);
  }
};

const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(e => {
          console.error('Error playing audio:', e);
          setAudioError('Failed to play audio. Please try again.');
        });
      }
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playHostPreview = (hostName) => {
    if (previewingHost === hostName) {
      previewAudioRef.current.pause();
      setPreviewingHost(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(`/${hostName}Intro.mp3`);
      previewAudioRef.current.play();
      setPreviewingHost(hostName);
      
      // Add event listener for when audio finishes playing
      previewAudioRef.current.onended = () => {
        setPreviewingHost(null);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.onended = null;
      }
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (newValue) => {
    const [newTime] = newValue;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Add this useEffect hook
  useEffect(() => {
    if (step > 0) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white relative">
      {/* Background SVG */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Cpath d='M322 368.204C304.902 368.831 287.615 368.824 270.679 369.296' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M181.141 70.1063C200.576 50.5697 239.064 63.1238 256.15 84.9016C292.926 131.776 272.317 231.712 184.415 219.155C125.41 213.621 116.716 97.9502 166.945 84.9016' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M268.495 245.338C270.547 214.115 285.207 212.676 293.477 217.287C310.489 226.772 313.002 287.246 298.836 290.723C271.238 297.497 267.045 259.457 270.474 241.977' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M290.982 297.189C290.981 316.883 292.281 333.262 292.281 355.942' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M232.341 348.549C232.891 319.001 231.622 266.383 227.001 241.54' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M149.474 241.54C123.268 272.114 115.231 315.883 109.53 361.541' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M211.257 163.744C248.174 156.489 237.181 204.817 211.257 198.414C192.867 193.872 192.867 163.744 207.809 163.744' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M233.117 138.184C233.117 136 232.751 133.664 233.07 131.382' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M206.332 138.184C206.332 135.918 206.332 133.648 206.332 131.382' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M120.167 114.157C167.68 105.86 120.217 205.648 109.895 144.402C108.18 134.235 106.226 121.817 112.635 112.695' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M271.819 116.655C279.312 111.394 288.475 107.113 291.763 118.718C303.437 173.84 261.944 180.937 271.029 128.006' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M121.843 104.532C126.754 6.39303 276.915 4.49008 288.179 100.583' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3Cpath d='M225.91 241.54C243.381 292.861 267.403 328.894 294.702 352.917' stroke='%23000000' stroke-opacity='0.9' stroke-width='16' stroke-linecap='round' stroke-linejoin='round'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat'
        }} />
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Mic className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">AI Podcast Generator</span>
            </div>
            <div className="flex items-center">
              <a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">Home</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to AI Podcast Generator</h1>
              <p className="text-xl text-gray-600 mb-6">Create your own personalized podcast in just a few steps, powered by cutting-edge AI technology.</p>
              <motion.button
                onClick={handleStartGenerate}
                className="px-8 py-4 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="mr-2 h-6 w-6" />
                  Start Generating Your Podcast
                </motion.div>
              </motion.button>
            </div>
            <div className="hidden md:block">
              <img src="/placeholder.svg?height=400&width=400" alt="AI Podcast Illustration" className="w-full h-auto" />
            </div>
          </div>
        )}

        {step > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Step 1: Enter Topic */}
              {step >= 1 && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img src="topic.svg?height=100&width=100" alt="Topic Selection" className="w-16 h-16 mr-4" />
                      <h2 className="text-2xl font-semibold">Enter Your Topic</h2>
                    </div>
                    <form onSubmit={handleTopicSubmit} className="space-y-4">
                      <div className="flex items-center">
                        <Input
                          type="text"
                          placeholder="e.g., Climate Change, AI, Space Exploration"
                          className="flex-grow p-4 text-lg"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          disabled={step > 1}
                        />
                        {step === 1 && (
                          <Button type="submit" className="ml-2 px-6">
                            Next
                          </Button>
                        )}
                        {step > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="ml-2" 
                            onClick={resetPodcastState}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {step === 1 && (
                        <div className="flex flex-wrap gap-2">
                          {topicSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setTopic(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Choose Podcast Format */}
              {step >= 2 && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img src="/profile.svg?height=100&width=100" alt="Podcast Format Selection" className="w-16 h-16 mr-4" />
                      <h2 className="text-2xl font-semibold">Choose Podcast Format</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all ${
                          podcastFormat === 'single' 
                            ? 'ring-2 ring-purple-500 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleFormatSelect('single')}
                      >
                        <CardContent className="p-4 flex flex-col items-center">
                          <Mic className="h-16 w-16 text-purple-600 mb-4" />
                          <h3 className="text-lg font-semibold text-center">Single Host</h3>
                          <p className="text-sm text-gray-600 text-center">One host discusses the topic</p>
                        </CardContent>
                      </Card>
                      <Card 
                        className={`cursor-pointer transition-all ${
                          podcastFormat === 'duo' 
                            ? 'ring-2 ring-purple-500 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleFormatSelect('duo')}
                      >
                        <CardContent className="p-4 flex flex-col items-center">
                          <Users className="h-16 w-16 text-purple-600 mb-4" />
                          <h3 className="text-lg font-semibold text-center">Two Hosts</h3>
                          <p className="text-sm text-gray-600 text-center">Two hosts discuss the topic</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Choose Host */}
              {step >= 3 && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img src="/dude.svg?height=100&width=100" alt="Host Selection" className="w-16 h-16 mr-4" />
                      <h2 className="text-2xl font-semibold">Choose Your Host{podcastFormat === 'duo' ? 's' : ''}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {podcastFormat === 'single' 
                        ? hosts.map((host, index) => (
                            <Card 
                              key={index}
                              className={`cursor-pointer transition-all ${
                                selectedHosts.includes(index)
                                  ? 'ring-2 ring-purple-500 shadow-lg' 
                                  : 'hover:shadow-md'
                              }`}
                              onClick={() => handleHostSelect(index)}
                            >
                              <CardContent className="p-4">
                                <img
                                  src={host.stillImage}
                                  alt={host.name}
                                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4"
                                />
                                <h3 className="text-lg font-semibold text-center">{host.name}</h3>
                                <p className="text-sm text-gray-600 text-center">{host.style}</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playHostPreview(host.name);
                                  }}
                                >
                                  {previewingHost === host.name ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                  {previewingHost === host.name ? 'Stop' : 'Preview'}
                                </Button>
                              </CardContent>
                            </Card>
                          ))
                        : (
                            <Card 
                              className={`cursor-pointer transition-all ${
                                selectedHosts.length === 2
                                  ? 'ring-2 ring-purple-500 shadow-lg' 
                                  : 'hover:shadow-md'
                              }`}
                              onClick={() => handleHostSelect(0)} // Any index works here
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-center mb-4">
                                  {duoHosts.map((host, index) => (
                                    <img
                                      key={index}
                                      src={host.stillImage}
                                      alt={host.name}
                                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-2"
                                    />
                                  ))}
                                </div>
                                <h3 className="text-lg font-semibold text-center">{duoHosts.map(host => host.name).join(" & ")}</h3>
                                <p className="text-sm text-gray-600 text-center">{duoHosts.map(host => host.style).join(" | ")}</p>
                              </CardContent>
                            </Card>
                          )
                      }
                    </div>
                    <Button onClick={handleHostConfirm} className="w-full">
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Generate Podcast */}
              {step >= 4 && !isPodcastGenerated && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img src="/listen.svg?height=100&width=100" alt="Podcast Generation" className="w-16 h-16 mr-4" />
                      <h2 className="text-2xl font-semibold">Generate Your Podcast</h2>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      {selectedHosts.map((hostIndex) => {
                        const hostInfo = getHostInfo(hostIndex);
                        return (
                          <div key={hostIndex} className="flex items-center">
                            <img
                              src={hostInfo.stillImage}
                              alt={`${hostInfo.name}`}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mr-4"
                            />
                            <div>
                              <h3 className="font-semibold">{hostInfo.name}</h3>
                              <p className="text-sm text-gray-600">{hostInfo.style}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-lg mb-4">Topic: {topic}</p>
                    <Button
                      className="w-full py-6 text-lg font-semibold"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          Generating Podcast...
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-6 w-6" />
                          Generate Podcast
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Listen to Podcast */}
              {isPodcastGenerated && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Listen to Your Podcast</h2>
                    <div className={`flex items-center mb-4 ${
                      podcastFormat === 'single' ? 'justify-between' : 'justify-center'
                    }`}>
                      {selectedHosts.map((hostIndex, index) => {
                        const hostInfo = getHostInfo(hostIndex);
                        return (
                          <div key={hostIndex} className={`flex flex-col items-center ${
                            podcastFormat === 'duo' && index === 0 ? 'mr-8' : ''
                          }`}>
                            <img
                              src={isPlaying ? hostInfo.gifImage : hostInfo.stillImage}
                              alt={`${hostInfo.name}`}
                              className={`rounded-full mb-2 transition-all duration-300 ${
                                isPlaying ? 'w-40 h-40 sm:w-48 sm:h-48' : 'w-32 h-32 sm:w-40 sm:h-40'
                              }`}
                            />
                            <div className="text-center">
                              <h3 className="font-semibold">{hostInfo.name}</h3>
                              <p className="text-sm text-gray-600">{hostInfo.style}</p>
                            </div>
                          </div>
                        );
                      })}
                      {isPlaying && (
                        <div className={`transition-opacity duration-300 ${
                          isPlaying ? 'opacity-100' : 'opacity-0'
                        } ${podcastFormat === 'single' ? 'order-last' : 'mx-8'}`}>
                          <img
                            src="/AudioWave.gif"
                            alt="Audio Wave"
                            className="w-48 h-48 sm:w-64 sm:h-64"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 mb-4">
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={1}
                        className="w-full"
                        onValueChange={handleSeek}
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <audio 
    ref={audioRef} 
    src={audioUrl} 
    className="hidden" 
    onPlay={() => setIsPlaying(true)}
    onPause={() => setIsPlaying(false)}
    onEnded={() => setIsPlaying(false)}
    onTimeUpdate={handleTimeUpdate}
    onLoadedMetadata={handleLoadedMetadata}
    onError={(e) => {
      console.error('Audio error:', e);
      setAudioError('Failed to load audio. Please try again.');
    }}
  />
  {audioError && (
    <div className="text-red-500 mt-2">{audioError}</div>
  )}

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-6">
                      <Button 
                        variant="default"
                        size="icon"
                        className="bg-purple-600 text-white rounded-full hover:bg-purple-700 h-12 w-12"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </Button>
                      <div className="relative group">
                        <Button variant="ghost" size="icon" className="hover:text-purple-600">
                          <Volume2 className="h-6 w-6" />
                        </Button>
                        <div className="absolute left-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Card className="p-2">
                            <Slider
                              value={[volume]}
                              max={100}
                              step={1}
                              orientation="vertical"
                              className="h-24"
                              onValueChange={(value) => setVolume(value[0])}
                            />
                          </Card>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}