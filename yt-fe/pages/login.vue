<script lang="ts" setup>
  import { z } from "zod"
  import type { FormSubmitEvent } from "#ui/types"

  const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Must be at least 6 characters"),
  })

  type Schema = z.infer<typeof schema>
  const state = reactive<Schema>({
    email: "",
    password: "",
  })
  const loginMutation = useLoginUser()
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    loginMutation.mutate(event.data)
  }
  definePageMeta({
    layout: "auth",
  })
</script>

<template>
  <UContainer class="flex flex-col justify-center items-center h-screen">
    <h1 class="text-2xl fontb-bold">Login</h1>
    <UForm
      class="flex flex-col space-y-4 items-center"
      :schema="schema"
      :state="state"
      @submit="onSubmit"
    >
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" class="w-[400px]" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="state.password" type="password" class="w-[400px]" />
      </UFormField>

      <ULink to="/register"> Not registered? Register! </ULink>

      <UButton
        :loading="loginMutation.isPending.value"
        :disabled="loginMutation.isPending.value"
        type="submit"
      >
        Login
      </UButton>
    </UForm>
  </UContainer>
</template>
