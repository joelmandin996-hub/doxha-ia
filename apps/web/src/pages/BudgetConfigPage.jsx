import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetProgressBar } from '@/components/budget/BudgetProgressBar.jsx';
import { formatCurrency } from '@/lib/formatters.js';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const BudgetConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const year = new Date().getFullYear();
      
      const configs = await pb.collection('budget_config').getFullList({
        filter: `annee = ${year}`,
        $autoCancel: false
      });

      if (configs.length > 0) {
        setConfig(configs[0]);
        const cats = await pb.collection('budget_categories').getFullList({
          filter: `budget_config_id = "${configs[0].id}"`,
          $autoCancel: false
        });
        
        // Mock spent calculation
        const mockCats = cats.map(c => ({
          ...c,
          spent: Math.floor(Math.random() * c.budget_annuel)
        }));
        
        setCategories(mockCats);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalSpent = categories.reduce((acc, cat) => acc + (cat.spent || 0), 0);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Budget</h1>
          <p className="text-muted-foreground mt-1">Définissez et suivez vos enveloppes budgétaires annuelles.</p>
        </div>
        <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Modifier Global</Button>
      </div>

      {config ? (
        <>
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg">Budget Global {config.annee}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-3xl font-bold tracking-tight">{formatCurrency(config.budget_global)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Prévu pour l'année</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-muted-foreground">{formatCurrency(totalSpent)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Dépensé à ce jour</div>
                </div>
              </div>
              <BudgetProgressBar spent={totalSpent} total={config.budget_global} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Card key={cat.id} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{cat.categorie}</h3>
                    <span className="text-sm font-medium px-2 py-1 rounded bg-muted/50 border">
                      {formatCurrency(cat.budget_annuel)}
                    </span>
                  </div>
                  <BudgetProgressBar spent={cat.spent} total={cat.budget_annuel} />
                  <p className="text-xs text-muted-foreground mt-3 text-right">
                    Reste : {formatCurrency(cat.budget_annuel - cat.spent)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <h3 className="text-lg font-semibold mb-2">Aucun budget défini pour {new Date().getFullYear()}</h3>
          <p className="text-muted-foreground mb-6">Commencez par créer l'enveloppe globale de l'année.</p>
          <Button>Créer le budget annuel</Button>
        </Card>
      )}
    </div>
  );
};

export default BudgetConfigPage;