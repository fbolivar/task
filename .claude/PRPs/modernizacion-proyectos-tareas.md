# PRP: Modernización de Proyectos y Tareas (Feature-First)

**Estado:** 🏗️ En Proceso
**Dueño:** Brain (AI) / User
**Fecha:** 2026-01-22

---

## 🎯 Objetivo
Transformar los módulos de Proyectos y Tareas en componentes premium, modulares y compatibles con la arquitectura multi-entidad, siguiendo el estándar de diseño establecido en el Dashboard y el módulo de Entidades.

## 🏗️ Estructura del Trabajo

### Fase 1: Módulo de Proyectos (The Executive Portfolio) ✅
- [x] **Estructura de Carpeta**: Crear `src/features/projects`.
- [x] **Servicios y Hooks**: Implementados `projectService.ts` y `useProjects.ts`.
- [x] **UI Premium**: `ProjectCard.tsx`, `ProjectHeader.tsx`, `ProjectModal.tsx`.
- [x] **Integración**: Actualizada `src/app/(main)/proyectos/page.tsx`.

### Fase 2: Módulo de Tareas (The Operational Hub) ✅
- [x] **Estructura de Carpeta**: Crear `src/features/tasks`.
- [x] **Servicios y Hooks**: Implementados `taskService.ts` y `useTasks.ts`.
- [x] **UI Premium**: `TaskCard.tsx`, `TaskHeader.tsx`, `TaskModal.tsx`.
- [x] **Integración**: Actualizada `src/app/(main)/tareas/page.tsx`.

### Fase 3: Integración Multi-Entidad & RLS ✅
- [x] Verificado que los servicios filtran por `activeEntityId`.
- [x] Diseño unificado con el ecosistema visual premium.

---

## 🎨 Especificaciones de Diseño
- **Estética**: Glassmorphism, bordes redondeados (`rounded-xl`), tipografía `font-black` para títulos.
- **Micro-interacciones**: Hover effects escalables, skeletons durante la carga.
- **Localización**: 100% Español.

## 🛠️ Stack Técnico
- **Framework**: Next.js 16.
- **Estado**: Zustand (integrado con `authStore` para `activeEntityId`).
- **DB**: Supabase (PostgreSQL).
- **Iconos**: Lucide React.
