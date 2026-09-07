import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomePage = () => {
    return (
        <div className="font-premium tracking-premium leading-premium flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <Helmet><title>Accueil - ChurchFlow</title></Helmet>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-premium-tight leading-premium-tight mb-6">
            Bienvenue sur ChurchFlow
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            La solution premium pour la gestion complète de votre communauté. Suivez les membres, les événements, et les finances en toute simplicité.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="rounded-xl font-medium tracking-premium" asChild>
              <Link to="/members">Gérer les membres</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl font-medium tracking-premium" asChild>
              <Link to="/events">Voir les événements</Link>
            </Button>
          </div>
        </div>
    )
}

export default HomePage;