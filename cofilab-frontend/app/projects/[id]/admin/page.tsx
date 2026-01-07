// cofilab-frontend/app/projects/[id]/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projects } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Copy, Wallet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'

// ✅ VALIDATION FORMAT LIGHTNING ADDRESS
const isValidLightningAddress = (addr: string) => {
  const trimmed = addr.trim()
  return trimmed.includes('@') || 
         trimmed.startsWith('lnurl') || 
         trimmed.startsWith('lnbc')
}

export default function ProjectAdminPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  // LNURL exemples prêts à copier
  const lnurlExamples = [
    {
      name: 'Wallet of Satoshi',
      address: 'tonuser@walletofsatoshi.com',
      description: 'Remplace "tonuser" par ton username'
    },
    {
      name: 'LNURL Test (Gratuit)',
      address: 'lnurl1dp68gurn8ghj7um9wfmxczxy6te4wsp5xgefvfrekjer2mt0d3kxzctnv9xhcnxvectsp5guh7nsr20jxmrcwp8xkenwsv56z8g6m3qgzex4eqq',
      description: 'Pour tests immédiats'
    },
    {
      name: 'Breez (MistyBreez)',
      address: 'user@getalby.com',
      description: 'Copie depuis Breez app → Receive'
    }
  ]

  useEffect(() => {
    if (!id) return
    
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const proj = await projects.retrieve(id!)
      setProject(proj)
      setWalletAddress(proj.funding_wallet_address || '')
    } catch (error) {
      toast.error('Erreur chargement projet')
    } finally {
      setLoading(false)
    }
  }

  const updateWallet = async () => {
    const trimmed = walletAddress.trim()
    
    // ✅ VALIDATION AVANT ENVOI
    if (!trimmed) {
      toast.error('Adresse wallet requise')
      return
    }
    
    if (!isValidLightningAddress(trimmed)) {
      toast.error('❌ Format invalide ! Utilise Lightning Address (@), LNURL ou BOLT11 (lnbc...)')
      return
    }

    setUpdating(true)
    try {
      await projects.update(id!, { 
        funding_wallet_address: trimmed 
      })
      
      toast.success('✅ Wallet configuré ! Teste maintenant le financement')
      
      // Refresh
      const proj = await projects.retrieve(id!)
      setProject(proj)
      
    } catch (error: any) {
      toast.error(`❌ Erreur: ${error.message || 'Vérifie tes permissions'}`)
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié !')
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
         <div>Chargement...</div>
        </div>
      </div>
    )
  }

  const hasWallet = !!project?.funding_wallet_address
  const isValidFormat = isValidLightningAddress(walletAddress)
  const isReady = hasWallet && walletAddress.trim() && isValidFormat

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="p-8 flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                ⚙️ Admin du projet {project?.name}
              </h1>
              <p className="text-xl text-gray-600">
                Configure le wallet Lightning pour recevoir les fonds
              </p>
            </div>

            {/* STATUS CARD */}
            <Card className="shadow-xl border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Statut Wallet
                </CardTitle>
                <CardDescription>
                  {hasWallet 
                    ? '✅ Prêt pour les paiements Lightning'
                    : '❌ Wallet non configuré'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {hasWallet ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <span className="font-mono text-sm text-green-800 truncate max-w-[300px]">
                      {project.funding_wallet_address}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(project.funding_wallet_address!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <p className="text-orange-800 text-center">
                      Aucun wallet configuré. Les financements échoueront !
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CONFIG FORM */}
            <Card>
              <CardHeader>
                <CardTitle>Configurer Wallet Lightning</CardTitle>
                <CardDescription>
                  Colle ton adresse LNURL, Lightning Address ou Pubkey
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="tonuser@walletofsatoshi.com ou lnurl1dp68g... ou lnbc10u..."
                  className={`font-mono text-lg h-12 ${
                    walletAddress.trim() && !isValidFormat 
                      ? 'border-red-300 ring-2 ring-red-200 focus:ring-red-500' 
                      : ''
                  }`}
                />
                
                {/* ✅ INDICATEUR FORMAT */}
                {walletAddress.trim() && (
                  <div className={`text-sm p-2 rounded-lg ${
                    isValidFormat 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {isValidFormat ? '✅ Format valide (Lightning)' : '❌ Format invalide'}
                  </div>
                )}
                
                <Button 
                  onClick={updateWallet}
                  disabled={!walletAddress.trim() || !isValidFormat || updating}
                  className="w-full h-12 text-lg"
                  variant={isReady ? "default" : "secondary"}
                >
                  {updating 
                    ? 'Sauvegarde...' 
                    : hasWallet 
                      ? '🔄 Mettre à jour'
                      : '💰 Activer paiements'
                  }
                </Button>
              </CardContent>
            </Card>

            {/* EXEMPLES PRÊTS */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 Adresses de test</CardTitle>
                <CardDescription>Copie-colle pour tester immédiatement</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {lnurlExamples.map((example, i) => (
                    <Card key={i} className="hover:shadow-md transition-all cursor-pointer p-4" 
                          onClick={() => {
                            setWalletAddress(example.address)
                            toast.success(`${example.name} copié`)
                          }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-600">{example.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{example.description}</p>
                        </div>
                        <Copy className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      </div>
                      <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs truncate">
                        {example.address}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ACTIONS */}
            <div className="flex gap-4 pt-8">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/projects/${id}`)}
                className="flex-1"
              >
                ← Retour projet
              </Button>
              {isReady && (
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => toast.success('✅ Projet prêt pour paiements Lightning !')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test OK
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
