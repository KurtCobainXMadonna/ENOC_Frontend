export default function ZwingApp() {
  const [view, setView] = useState("login");
  const [currentProject, setCurrentProject] = useState(null);

  const handleLogin = () => setView("dashboard");
  const handleOpenProject = (project) => { setCurrentProject(project); setView("rack"); };
  const handleBack = () => setView("dashboard");

  return (
    <>
      <style>{css}</style>
      {view === "login" && <LoginPage onLogin={handleLogin} />}
      {view === "dashboard" && <Dashboard onOpenProject={handleOpenProject} />}
      {view === "rack" && currentProject && <ChannelRackPage project={currentProject} onBack={handleBack} />}
    </>
  );
}