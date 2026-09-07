import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { User, Palette, Globe } from 'lucide-react';

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const { currentTheme, setTheme } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(t('settings.saving'));
    }, 600);
  };

  const handleThemeChange = (val) => {
    setTheme(val);
    toast.success(t('settings.successTheme'));
  };

  const handleLanguageChange = (val) => {
    setLanguage(val);
    toast.success(t('settings.successLang'));
  };

  return (
    <>
      <Helmet>
        <title>{t('settings.title')} - Church CRM</title>
        <meta name="description" content="Manage your account and application settings" />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl font-premium tracking-premium leading-premium">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-premium-tight leading-premium-tight text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-1">
            <div className="px-3 py-2 text-muted-foreground hover:bg-accent rounded-lg font-medium tracking-premium flex items-center gap-3 cursor-pointer transition-colors">
              <User className="w-4 h-4" /> {t('settings.profileInfo')}
            </div>
            <div className="px-3 py-2 text-muted-foreground hover:bg-accent rounded-lg font-medium tracking-premium flex items-center gap-3 cursor-pointer transition-colors">
              <Palette className="w-4 h-4" /> {t('settings.appearance')}
            </div>
            <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium tracking-premium flex items-center gap-3">
              <Globe className="w-4 h-4" /> {t('settings.language')}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profileInfo')}</CardTitle>
                <CardDescription>{t('settings.profileDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('settings.fullName')}</Label>
                    <Input 
                      id="name" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})} 
                      disabled
                    />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={loading} className="font-medium">
                      {loading ? t('settings.saving') : t('settings.saveProfile')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
                <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('settings.themePref')}</Label>
                  <Select value={currentTheme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                      <SelectItem value="auto">{t('settings.auto')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language')}</CardTitle>
                <CardDescription>{t('settings.languageDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;