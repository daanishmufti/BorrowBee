import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function Header({ user, onLoginClick, onRegisterClick }: HeaderProps) {
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
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="nav-button primary"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => window.location.href = '/api/logout'}
                  className="nav-button secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={onLoginClick} className="nav-button primary">
                  Log In
                </button>
                <button onClick={onRegisterClick} className="nav-button secondary">
                  Register
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
