import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <header>
                <h1>My Vercel App</h1>
            </header>
            <main>{children}</main>
            <footer>
                <p>© {new Date().getFullYear()} My Vercel App</p>
            </footer>
        </div>
    );
};

export default Layout;