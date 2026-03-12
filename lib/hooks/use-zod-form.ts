/**
 * Hook personnalisé pour simplifier l'utilisation de react-hook-form avec Zod
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { type z } from "zod";

/**
 * Hook pour créer un formulaire avec validation Zod
 *
 * @example
 * ```tsx
 * const loginSchema = z.object({
 *   email: z.string().email("Email invalide"),
 *   password: z.string().min(6, "Minimum 6 caractères"),
 * });
 *
 * function LoginForm() {
 *   const form = useZodForm({
 *     schema: loginSchema,
 *     defaultValues: { email: "", password: "" },
 *   });
 *
 *   const onSubmit = form.handleSubmit(async (data) => {
 *     // data est typé automatiquement
 *     await login(data);
 *   });
 *
 *   return (
 *     <Form {...form}>
 *       <form onSubmit={onSubmit}>
 *         <FormInputField name="email" label="Email" type="email" />
 *         <FormPasswordField name="password" label="Mot de passe" />
 *         <Button type="submit">Se connecter</Button>
 *       </form>
 *     </Form>
 *   );
 * }
 * ```
 */
export function useZodForm<TSchema extends z.ZodType<any, any, any>>(
  props: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & {
    schema: TSchema;
  }
): UseFormReturn<z.infer<TSchema>> {
  const form = useForm<z.infer<TSchema>>({
    ...props,
    resolver: zodResolver(props.schema) as any,
  });

  return form;
}
