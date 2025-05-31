import { FaLinkedin, FaFacebook, FaInstagram, FaGithub, FaGlobe } from 'react-icons/fa';

export default function About() {
  return (
    <div className="about-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200"
          >
            ← Back to Library
          </button>
        </div>
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="profile-image-container mb-6">
            <img 
              src="https://daanishmufti.site/dd.jpg" 
              alt="Daanish Ahmad Mufti" 
              className="rounded-full w-48 h-48 mx-auto object-cover shadow-lg border-4 border-amber-300"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Daanish Ahmad Mufti</h1>
          <p className="text-xl text-gray-600 mb-6">Computer Science Student & Software Developer</p>
          
          {/* Social Media Links */}
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="https://www.linkedin.com/in/daanish-mufti-1451a0290/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <FaLinkedin size={32} />
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=100073440296946" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <FaFacebook size={32} />
            </a>
            <a 
              href="https://www.instagram.com/daanish_mufti/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-800 transition-colors duration-200"
            >
              <FaInstagram size={32} />
            </a>
            <a 
              href="https://github.com/daanishmufti/daanishmufti" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-gray-900 transition-colors duration-200"
            >
              <FaGithub size={32} />
            </a>
            <a 
              href="https://daanishmufti.site/index.php" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-800 transition-colors duration-200"
            >
              <FaGlobe size={32} />
            </a>
          </div>
        </div>

        {/* About Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About Me</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="mb-6">
              Hello! My name is Daanish Ahmad Mufti, and I am a Bachelor's student in Computer Science at 
              Ghulam Ishaq Khan Institute of Engineering Sciences and Technology (GIKI), Pakistan. Although 
              I am currently living in Pakistan, I am originally from the United Kingdom. My background 
              allows me to connect with a diverse range of cultures and work environments.
            </p>

            <p className="mb-6">
              I am passionate about software development, hardware engineering, and technology. I have 
              hands-on experience with various programming languages, including Python, C, C++, and 
              databases like PostgreSQL and MongoDB. In addition to this, I have developed web applications 
              using HTML, CSS, and several frameworks.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Technical Expertise</h3>
            
            <p className="mb-6">
              My expertise spans not just software but also hardware engineering. I have worked extensively 
              with Arduino, Raspberry Pi, and various hardware components such as ICs, chips, actuators, 
              and sensors. These projects allow me to combine both software and hardware for innovative 
              solutions, bridging the gap between the digital and physical world.
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Notable Projects</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-amber-600 mb-2">Game Development</h4>
                <p>Using C++ and SFML, I developed interactive 2D games that focus on graphics and real-time 
                game mechanics. These projects improved my understanding of game loops, rendering, and physics simulations.</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-amber-600 mb-2">OpenCV-based Projects</h4>
                <p>I have integrated OpenCV into my projects for image processing tasks such as Attendance 
                Systems using face recognition and Mask Detection Systems to detect whether individuals are 
                wearing a mask.</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-amber-600 mb-2">Statistical Programs</h4>
                <p>Developed a student grading system using Pandas for data manipulation and Matplotlib for 
                data visualization, enabling analysis of student performance and generating insightful reports.</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-amber-600 mb-2">Clustering Data</h4>
                <p>I have implemented clustering algorithms such as K-Means, DBSCAN, and Hierarchical 
                Clustering to analyze large datasets, identify patterns, and group similar data points.</p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Future Goals</h3>
            
            <p className="mb-6">
              Currently, I am seeking an internship or job opportunity in the UK, where I can apply my 
              skills in real-world scenarios and continue to grow professionally. I am highly adaptable 
              and open to various work environments, and I am willing to relocate if necessary.
            </p>

            <p className="mb-6">
              This BorrowBee digital library platform showcases some of my work in full-stack web development. 
              Feel free to explore the application and get in touch if you are interested in collaborating 
              or offering opportunities in your organization!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}