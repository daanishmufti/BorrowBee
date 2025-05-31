import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function Header({ user, onLoginClick, onRegisterClick }: HeaderProps) {
  const { logout } = useAuth();
  return (
    <header>
      <div className="container">
        <nav>
          <div className="logo" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', 
            marginLeft: '20px',
            minWidth: '200px',
            flexShrink: 0
          }}>
            <img 
              src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEBUUEBMVFhMXGBcWGRYWFhUZFhYbGhUdFx8XFRcdHSggGCAlHRcYITEhJikrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGi0lHyUuLSs1MjMtLSswLi0tLS4rMC8tKzctLy8tLy0tLS0tNysvNTctLy0rLS0vLS0tLS0tLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAABBAMBAAAAAAAAAAAAAAAAAQUGBwIDBAj/xABGEAACAAQDBQYDBQUGBQQDAAABAgADBBEFBjJBYRMiUXGBkQdV8BQjQnKCM1OisjJiscEVJFOS0eE0Q3OiwoOys/EXJWP/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAgMEBQEG/8QAMhEAAgIBAgMFCAIBBQAAAAAAAAECAxEUMRIhQQUTUWFxIjKBkbHB0f"
              alt="BorrowBee Logo" 
              style={{ 
                width: '50px', 
                height: '50px', 
                marginRight: '12px',
                flexShrink: 0
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'inline-block';
              }}
            />
            <span 
              style={{ 
                fontSize: '40px', 
                marginRight: '12px',
                flexShrink: 0,
                display: 'none'
              }}
            >
              🐝
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>BorrowBee</span>
          </div>
          
          <div className="nav-buttons-container">
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#FF8C00', fontWeight: '600' }}>
                  <span>🐝</span>
                  <span>Welcome, {user.name}!</span>
                </div>
                {window.location.pathname === '/dashboard' ? (
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="btn btn-secondary"
                  >
                    🍯 Back to Library
                  </button>
                ) : (
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn btn-secondary"
                  >
                    Dashboard
                  </button>
                )}
                <button 
                  onClick={() => window.location.href = '/about'}
                  className="btn btn-secondary"
                >
                  About
                </button>
                <button 
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="nav-auth-buttons">
                <button 
                  onClick={() => window.location.href = '/about'}
                  className="btn btn-secondary"
                >
                  About
                </button>
                <button 
                  onClick={() => {
                    console.log("Login button clicked");
                    onLoginClick();
                  }}
                  className="btn btn-secondary"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    console.log("Register button clicked");
                    onRegisterClick();
                  }}
                  className="btn btn-primary"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
