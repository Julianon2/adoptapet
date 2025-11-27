import { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RightSidebar from '../components/common/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import PostCard from '../components/common/PostCard';
import PostModal from '../components/common/PostModal';
import FeaturedPetsMobile from '../components/common/FeaturedPetsMobile';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const posts = [
    {
      id: 1,
      userName: 'Refugio San Luis',
      userAvatar: 'https://via.placeholder.com/48',
      time: 'Hace 2 horas',
      location: 'Bogotá',
      content: 'Tenemos esta hermosa perrita lista para encontrar un nuevo hogar lleno de amor. 🏡💕 Es muy cariñosa y se lleva bien con niños.',
      image: 'https://placedog.net/600',
      likes: 127,
      comments: 23
    },
    {
      id: 2,
      userName: 'Fundación Huellitas',
      userAvatar: 'https://via.placeholder.com/48',
      time: 'Hace 5 horas',
      location: 'Medellín',
      content: '¡Conoce a Max! 🐾 Este gatito de 3 meses busca una familia que lo ame.',
      image: 'https://placekitten.com/600/400',
      likes: 89,
      comments: 15
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto pt-4 md:pt-6 px-3 md:px-4 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <Sidebar onOpenModal={() => setIsModalOpen(true)} />

        <main className="md:col-span-6 space-y-4 md:space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          <FeaturedPetsMobile />
        </main>

        <RightSidebar />
      </div>

      <BottomNav onOpenModal={() => setIsModalOpen(true)} />
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}