import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.string().min(1, "Please select your role"),
  profilePicture: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
});

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");

  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; userType?: string }>({});
  const { toast } = useToast();
  const { setUser } = useAuth();

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; userType: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      onClose();
      toast({
        title: "Welcome to your reading adventure! 🌟",
        description: "Your BorrowBee account is ready!",
      });
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setUserType("");
      // Force a page refresh to ensure state updates
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      registerSchema.parse({ name, email, password, userType });
      registerMutation.mutate({ name, email, password, userType });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string; email?: string; password?: string; userType?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') fieldErrors.name = err.message;
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
          if (err.path[0] === 'userType') fieldErrors.userType = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-300 p-8 w-96 relative mx-4" style={{zIndex: 10000}} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-orange-600 hover:text-yellow-400 transition-all duration-300 hover:scale-110"
        >
          ×
        </button>
        
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: '#333', 
          marginBottom: '1rem', 
          textAlign: 'center' 
        }}>
          Sign Up 🐝
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
              style={{ borderColor: errors.name ? '#ef4444' : undefined }}
            />
            {errors.name && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.name}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
              style={{ borderColor: errors.email ? '#ef4444' : undefined }}
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{ borderColor: errors.password ? '#ef4444' : undefined }}
            />
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>User Type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
              style={{ borderColor: errors.userType ? '#ef4444' : undefined }}
            >
              <option value="">Select user type</option>
              <option value="parent">Parent/Guardian</option>
              <option value="child">Young Reader</option>
              <option value="teacher">Teacher</option>
              <option value="librarian">Librarian</option>
            </select>
            {errors.userType && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.userType}</p>
            )}
          </div>


          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={registerMutation.isPending}
            style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
          >
            {registerMutation.isPending ? (
              "Creating account..."
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
