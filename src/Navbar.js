const Navbar = () => {
    return (
      <nav className="navbar">
        <img
          src="\assets\tphead.png"
          alt="Training Point Logo"
          className="logo"
        />        
        <div className="links">
          <a href="/">Sign Up</a>
          <a href="/create" style={{ 
            color: 'white', 
            backgroundColor: '#1EB980',
            borderRadius: '8px' 
          }}>Login</a>
        </div>
      </nav>
    );
  }
   
  export default Navbar;