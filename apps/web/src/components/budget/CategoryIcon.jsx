import React from 'react';
import { HeartHandshake, Building, Lightbulb, Droplet, Shield, PhoneCall, Laptop, Globe, Users, Wallet, Calendar, Bus, Wrench, Coins as HandCoins, DollarSign, PackageOpen, HelpCircle } from 'lucide-react';

export const CategoryIcon = ({ category, className }) => {
  const iconMap = {
    'Dîmes': <Wallet className={className} />,
    'Offrandes': <HandCoins className={className} />,
    'Dons': <HeartHandshake className={className} />,
    'Dons par projet': <PackageOpen className={className} />,
    'Subventions': <Building className={className} />,
    'Événements': <Calendar className={className} />,
    'Loyer': <Building className={className} />,
    'Électricité': <Lightbulb className={className} />,
    'Eau': <Droplet className={className} />,
    'Assurance': <Shield className={className} />,
    'Communication': <PhoneCall className={className} />,
    'Matériel': <Laptop className={className} />,
    'Missions': <Globe className={className} />,
    'Aide sociale': <Users className={className} />,
    'Salaires': <DollarSign className={className} />,
    'Transport': <Bus className={className} />,
    'Travaux': <Wrench className={className} />,
    'Autres': <HelpCircle className={className} />
  };

  return iconMap[category] || <HelpCircle className={className} />;
};