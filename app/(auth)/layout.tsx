const AuthLayout = ({ children }:{ children: React.ReactNode }) => {

  return (
    <div className="min-h-screen h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          {children}
        </div>
    </div>
  );
}

export default AuthLayout;
