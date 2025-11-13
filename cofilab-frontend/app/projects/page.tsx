'use client'

import { useEffect, useState, useCallback } from 'react' // Importez useCallback
import { useRouter } from 'next/navigation'
import { projects } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
// Importation du nouveau composant
import CreateProjectModal from '@/app/_components/CreateProjectModal' 
// Importation du composant et de l'interface
import ProjectCard, { Project } from '@/app/_components/ProjectCard' 

export default function ProjectsPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
                <Header />
                <ProjectsPageContent />
            </div>
        </div>
    )
}

function ProjectsPageContent() {
    const router = useRouter()
    const [projectList, setProjectList] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fonction de chargement des projets (maintenant exportable/rappelable)
    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await projects.list();
            setProjectList(data);
            setError(null);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                setError("Veuillez vous connecter pour voir tous les projets.");
            } else {
                console.error("Erreur de chargement de l'API:", err);
                setError("Erreur de chargement des projets. Vérifiez votre connexion API.");
            }
        } finally {
            setLoading(false);
        }
    }, []); // Dépendances vides pour un chargement unique

    useEffect(() => {
        loadProjects();
    }, [loadProjects]); // Utilise loadProjects comme dépendance

    if (loading) return <div className="p-6 text-gray-600">Chargement des projets...</div>

    return (
        <main className="p-6 flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#1c2541]">Liste des Projets</h1>
                
                {/* Remplacement du bouton simple par le composant Modal */}
                <CreateProjectModal 
                    onProjectCreated={loadProjects} // Passe la fonction pour recharger la liste après création
                />
            </div>

            {error && <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectList.length > 0 ? (
                    projectList.map(project => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                        />
                    ))
                ) : (
                    <p className="md:col-span-3 text-center text-gray-500">Aucun projet trouvé pour le moment.</p>
                )}
            </div>
        </main>
    )
}