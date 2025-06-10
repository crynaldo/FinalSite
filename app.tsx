"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, Settings, Sparkles, FileText, Download, X, ExternalLink, Command } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  isFile?: boolean
  fileName?: string
  fileType?: string
  fileSize?: string
}

const SCRIPTS_FILE_CONFIG = {
  fileName: "All_Scripts.zip",
  fileType: "ZIP file",
  filePath: "./All_Scripts.zip",
  fileSize: "2.4 MB",
}

const commandSuggestions = [
  {
    icon: "🖼️",
    label: "Clone UI",
    description: "Generate a UI from a screenshot",
    prefix: "/clone",
  },
  {
    icon: "🎨",
    label: "Import Figma",
    description: "Import a design from Figma",
    prefix: "/figma",
  },
  {
    icon: "📄",
    label: "Create Page",
    description: "Generate a new web page",
    prefix: "/page",
  },
  {
    icon: "✨",
    label: "Improve",
    description: "Improve existing UI design",
    prefix: "/improve",
  },
  {
    icon: "🔗",
    label: "Discord",
    description: "Join our Discord server",
    prefix: "/discord",
  },
]

const fallbackResponses = [
  "I'm currently running in demo mode, so my responses might be a bit limited. For the full AI experience, you can add your Cohere API key in the settings! In the meantime, our Discord community is always active and ready to help with any questions you might have.",
  "That's a great question! While I'm in demo mode right now, I'd love to help you find the answer. Our Discord community has tons of knowledgeable members who could dive deep into that topic with you.",
  "Interesting topic! I'm running with limited capabilities at the moment, but our Discord server has some really smart people who love discussing these kinds of questions. You might get some fascinating insights there!",
  "I'd love to give you a more detailed response, but I'm currently in demo mode. For better AI interactions, consider adding your Cohere API key in settings. Otherwise, our Discord community is incredibly helpful for questions like this!",
  "Good question! While my demo mode responses are pretty basic, our Final Site community has members with deep expertise in all sorts of tech topics. They'd probably have some great insights to share!",
]

export default function FinalSiteChat() {
  const [loading, setLoading] = useState(true)
  const [value, setValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [tempApiKey, setTempApiKey] = useState("")
  const [showDiscordConfirm, setShowDiscordConfirm] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [chatState, setChatState] = useState({ status: "idle", awaitingResponse: false })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Load saved API key
    const savedKey = localStorage.getItem("cohere_api_key") || ""
    setApiKey(savedKey)

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
      if (!savedKey) {
        setTimeout(() => setShowApiKeyModal(true), 1000)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px"
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 60), 200)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }

  const getFallbackResponse = (userMessage = "") => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("script")) {
      return "I'd love to tell you about our scripts! We have a huge collection of completely free automation tools, utilities, and development helpers. Our Discord community has even more resources and people who can help you find exactly what you need. Want me to share our scripts collection?"
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return "I'm here to help! While I'm running in demo mode right now, I can still try to assist you. Our Discord community is also incredibly active - we have developers, scripters, and tech enthusiasts who love helping each other out. What specific help are you looking for?"
    }

    if (lowerMessage.includes("discord")) {
      return "Our Discord server is the heart of the Final Site community! It's where we share scripts, help each other with coding problems, discuss new tech, and just hang out. We've got channels for different programming languages, script sharing, general tech talk, and more. It's a really welcoming community for all skill levels."
    }

    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      return "I'm Zap, the AI assistant for Final Site! I'm here to help you learn about our community, find scripts, answer tech questions, and connect you with our awesome Discord community. Think of me as your friendly guide to everything Final Site has to offer. What would you like to know?"
    }

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  }

  const simulateTyping = async (message: string, isFile = false, fileName = "", fileType = "", fileSize = "") => {
    setIsTyping(true)

    const baseDelay = 1000
    const lengthDelay = Math.min(message.length * 30, 3000)
    const typingDelay = baseDelay + lengthDelay

    setTimeout(() => {
      setIsTyping(false)
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: "ai",
        timestamp: new Date(),
        isFile,
        fileName,
        fileType,
        fileSize,
      }
      setMessages((prev) => [...prev, newMessage])
    }, typingDelay)
  }

  const handleSendMessage = async () => {
    if (!value.trim()) return

    const userMessage = value.trim()

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setValue("")

    // Handle special commands
    if (userMessage.toLowerCase() === "/discord") {
      setShowDiscordConfirm(true)
      return
    }

    // Check for script keywords
    const scriptKeywords = ["script", "download", "file", "code", "automation", "tool"]
    const hasScriptKeyword = scriptKeywords.some((keyword) => userMessage.toLowerCase().includes(keyword))

    // Get AI response (fallback for demo)
    const aiResponse = getFallbackResponse(userMessage)
    await simulateTyping(aiResponse)

    // Offer file if they asked about scripts
    if (hasScriptKeyword && userMessage.toLowerCase().includes("script")) {
      setTimeout(async () => {
        await simulateTyping("Here's our complete scripts collection! 📁")
        setTimeout(() => {
          const fileMessage: Message = {
            id: Date.now().toString(),
            content: SCRIPTS_FILE_CONFIG.fileName,
            sender: "ai",
            timestamp: new Date(),
            isFile: true,
            fileName: SCRIPTS_FILE_CONFIG.fileName,
            fileType: SCRIPTS_FILE_CONFIG.fileType,
            fileSize: SCRIPTS_FILE_CONFIG.fileSize,
          }
          setMessages((prev) => [...prev, fileMessage])
        }, 500)
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const saveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim())
      localStorage.setItem("cohere_api_key", tempApiKey.trim())
    }
    setShowApiKeyModal(false)
    setTempApiKey("")
  }

  const skipApiKey = () => {
    setShowApiKeyModal(false)
    setTempApiKey("")
  }

  const handleDiscordYes = () => {
    window.open("https://discord.gg/nn9Gzppq6V", "_blank")
    setShowDiscordConfirm(false)
  }

  const handleDiscordNo = () => {
    setShowDiscordConfirm(false)
    simulateTyping(
      "No problem! The Discord link is always here when you're ready. Feel free to ask me anything else! 🤖",
    )
  }

  const handleDownloadFile = (fileName: string) => {
    // Create a mock download
    const link = document.createElement("a")
    link.href = "#"
    link.download = fileName
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="relative">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent animate-pulse">
            Final Site
          </h1>
          <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[96px] animate-pulse"></div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="bg-black/90 border-white/10 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium text-white mb-4">🤖 Enable AI Chat</h3>
            <p className="text-white/70 mb-4">To enable AI responses, please enter your Cohere API key:</p>

            <input
              type="password"
              placeholder="Your Cohere API key..."
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-violet-500 mb-4"
            />

            <div className="text-xs text-white/50 mb-4">
              <p>
                • Get your API key from{" "}
                <a
                  href="https://dashboard.cohere.ai/api-keys"
                  target="_blank"
                  className="text-violet-400 hover:text-violet-300"
                  rel="noreferrer"
                >
                  Cohere Dashboard
                </a>
              </p>
              <p>• Your key is stored locally and never shared</p>
              <p>• You can change it anytime in settings</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={skipApiKey} variant="outline" size="sm">
                Skip (Demo Mode)
              </Button>
              <Button onClick={saveApiKey} size="sm">
                Save & Continue
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Discord Confirmation */}
      {showDiscordConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="bg-black/90 border-white/10 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium text-white mb-4">Leave this site?</h3>
            <p className="text-white/70 mb-6">Would you like to leave this site to join our discord server?</p>

            <div className="flex justify-end gap-3">
              <Button onClick={handleDiscordNo} variant="outline" size="sm">
                No
              </Button>
              <Button onClick={handleDiscordYes} size="sm" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Yes, join Discord
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-medium tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              Final Site
            </h1>
            <p className="text-sm text-white/40">
              Chat with Zap, our AI assistant
              {!apiKey && <span className="text-violet-400"> (Demo Mode)</span>}
              {apiKey && <span className="text-green-400"> (AI Enabled)</span>}
            </p>
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <Card className="bg-white/[0.02] border-white/[0.05] overflow-hidden">
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      {message.isFile ? (
                        <div className="bg-white/[0.05] border border-white/10 text-white/90 px-4 py-3 rounded-lg flex items-center gap-3">
                          <div className="bg-violet-500/20 p-2 rounded-md">
                            <FileText className="w-5 h-5 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{message.fileName}</p>
                            <p className="text-xs text-white/50">
                              {message.fileType} {message.fileSize && `• ${message.fileSize}`}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleDownloadFile(message.fileName!)}
                            size="sm"
                            variant="ghost"
                            className="ml-4"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-2 rounded-lg max-w-[80%] text-sm ${
                            message.sender === "user"
                              ? "bg-violet-500/20 text-white ml-auto"
                              : "bg-white/[0.05] border border-white/10 text-white/90"
                          }`}
                        >
                          {message.content}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </Card>
          )}

          {/* Input Area */}
          <Card className="bg-white/[0.02] border-white/[0.05] backdrop-blur">
            <div className="p-4">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask zap anything..."
                className="resize-none bg-transparent border-none text-white/90 text-sm focus:outline-none placeholder:text-white/20 min-h-[60px]"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                  >
                    <span>{file}</span>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setAttachments((prev) => [...prev, `file-${Math.floor(Math.random() * 1000)}.pdf`])}
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white/90"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowCommandPalette(!showCommandPalette)}
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white/90"
                >
                  <Command className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowApiKeyModal(true)}
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white/90"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={isTyping || !value.trim()}
                className={`${
                  value.trim() ? "bg-white text-black shadow-lg" : "bg-white/[0.05] text-white/40"
                } flex items-center gap-2`}
                size="sm"
              >
                {isTyping ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </Button>
            </div>
          </Card>

          {/* Command Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {commandSuggestions.map((suggestion, index) => (
              <Button
                key={suggestion.prefix}
                onClick={() => setValue(suggestion.prefix + " ")}
                variant="ghost"
                size="sm"
                className="bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white/90 flex items-center gap-2"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/[0.02] backdrop-blur rounded-full px-4 py-2 border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-7 rounded-full bg-white/[0.05] flex items-center justify-center">
                <span className="text-xs font-medium text-white/90">zap</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Thinking</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hints Button */}
        <Button
          onClick={() => setHintsOpen(!hintsOpen)}
          className="fixed bottom-6 left-6 bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white/90 flex items-center gap-2"
          size="sm"
        >
          <Sparkles className="w-4 h-4" />
          Hints
        </Button>

        {/* Hints Panel */}
        {hintsOpen && (
          <Card className="fixed bottom-20 left-6 bg-black/80 backdrop-blur border-white/10 w-72">
            <div className="p-4 space-y-4">
              <div className="text-center border-b border-white/10 pb-2">
                <h3 className="text-white font-medium">AI Message Hints</h3>
              </div>
              <div className="space-y-3">
                {["Scripts", "Help", "Hi"].map((hint) => (
                  <div
                    key={hint}
                    onClick={() => {
                      setValue(hint)
                      setHintsOpen(false)
                    }}
                    className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <p className="text-white/80 text-sm">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
