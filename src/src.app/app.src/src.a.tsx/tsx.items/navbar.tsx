import { useState } from "react"
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
    const navigate = useNavigate();
    const moveToHome = () => navigate("/welcome");
    const moveToLobby = () => navigate("/lobby");

    const [defNavbar, setNavbar] = useState(false);

    return (
        <div>
            {defNavbar && (
                <div className="navbar">
                    <div className="navbar-container">
                        <div className="navbar-item" onClick={moveToHome}>Home</div>
                        <div className="navbar-item" onClick={moveToLobby}>Lobby</div>
                        <div className="navbar-item">Settings</div>
                    </div>
                </div>
            )}
            <div className="navbar-button" onClick={() => setNavbar(prev => !prev)}>Menu</div>
        </div>
    );
};

export default Navbar;