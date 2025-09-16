interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
    const { serverId } = await params;
    
    return ( 
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Server Page</h1>
                <p className="text-gray-600">Server ID: {serverId}</p>
            </div>
        </div>
     );
}

export default ServerIdPage;