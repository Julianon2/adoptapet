import React, { useState, useEffect } from 'react';

const DebugPosts = ({ userId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, [userId]);

    const loadPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            console.log('=== ESTRUCTURA DE POSTS ===');
            console.log('Data completa:', data);
            console.log('Posts:', data.data?.posts);
            
            if (data.data?.posts && data.data.posts.length > 0) {
                const firstPost = data.data.posts[0];
                console.log('Primer post completo:', firstPost);
                console.log('Likes del primer post:', firstPost.likes);
                console.log('Tipo de likes:', typeof firstPost.likes);
                console.log('Es array?:', Array.isArray(firstPost.likes));
                console.log('Stats:', firstPost.stats);
                console.log('Author:', firstPost.author);
            }

            setPosts(data.data?.posts || []);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-bold mb-4">Debug de Posts</h2>
            <div className="space-y-4">
                {posts.map((post, index) => (
                    <div key={post._id} className="bg-white p-4 rounded shadow">
                        <h3 className="font-bold">Post #{index + 1}</h3>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {JSON.stringify({
                                _id: post._id,
                                content: post.content?.substring(0, 50) + '...',
                                likes: post.likes,
                                likesType: typeof post.likes,
                                isArray: Array.isArray(post.likes),
                                likesLength: post.likes?.length,
                                stats: post.stats,
                                author: {
                                    _id: post.author?._id,
                                    name: post.author?.name
                                }
                            }, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugPosts;