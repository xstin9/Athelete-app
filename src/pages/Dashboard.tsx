import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("loggedIn")
    navigate("/")
  }

  return (
    <div>
      <h1>🏃 Athlete Dashboard</h1>
      <p>Welcome. This is where training data will live.</p>

      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default Dashboard
