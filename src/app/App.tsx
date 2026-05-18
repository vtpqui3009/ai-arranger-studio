import { useState } from 'react'
import { LandingPage } from '../components/layout/LandingPage'
import { WorkspacePage } from '../features/arranger/components/WorkspacePage'
import { loadProject } from '../lib/storage/projectStorage'
import { ROUTES, type AppRoute } from './routes'

export default function App() {
  const [route, setRoute] = useState<AppRoute>(ROUTES.landing)
  const [hasSavedProject, setHasSavedProject] = useState(() => hasLocalProject())

  const navigateToLanding = () => {
    setHasSavedProject(hasLocalProject())
    setRoute(ROUTES.landing)
  }

  if (route === ROUTES.studio) {
    return <WorkspacePage onBackToLanding={navigateToLanding} />
  }

  return (
    <LandingPage
      hasSavedProject={hasSavedProject}
      onOpenStudio={() => setRoute(ROUTES.studio)}
      onLoadSaved={() => setRoute(ROUTES.studio)}
    />
  )
}

function hasLocalProject(): boolean {
  try {
    return loadProject() !== null
  } catch {
    return false
  }
}
