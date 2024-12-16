import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface ArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: any;
  onClose: () => void;
}

export function ArticleDialog({ open, onOpenChange, article, onClose }: ArticleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      category: "Kaffekunskap",
      slug: "",
      reading_time: 5,
    },
  });

  // Reset form with article data when editing
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        content: article.content,
        category: article.category,
        slug: article.slug,
        reading_time: article.reading_time,
      });
    } else {
      form.reset({
        title: "",
        content: "",
        category: "Kaffekunskap",
        slug: "",
        reading_time: 5,
      });
    }
  }, [article, form]);

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      if (article) {
        const { error } = await supabase
          .from('articles')
          .update({
            title: values.title,
            content: values.content,
            category: values.category,
            slug: values.slug,
            reading_time: values.reading_time,
          })
          .eq('id', article.id);

        if (error) throw error;
        toast.success("Artikel uppdaterad");
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([{
            title: values.title,
            content: values.content,
            category: values.category,
            slug: values.slug,
            reading_time: values.reading_time,
          }]);

        if (error) throw error;
        toast.success("Artikel skapad");
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{article ? "Redigera artikel" : "Skapa ny artikel"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="Artikelns titel..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="url-vanlig-text" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Kaffekunskap" id="kaffekunskap" />
                        <label htmlFor="kaffekunskap">Kaffekunskap</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Säljutbildning" id="saljutbildning" />
                        <label htmlFor="saljutbildning">Säljutbildning</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reading_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lästid (minuter)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="5" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Innehåll</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Skriv artikelns innehåll här..."
                      className="min-h-[300px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sparar..." : article ? "Uppdatera" : "Skapa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}