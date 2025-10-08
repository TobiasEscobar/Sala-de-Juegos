import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { loginGuard } from './guards/login-guard';
import { registerGuard } from './guards/register-guard';


export const routes: Routes = [
    { 
        path: '', 
        redirectTo: '/home', 
        pathMatch: 'full' 
    },
    { 
        path: 'home', 
        component: Home // Sin lazy loading - carga inmediata
    },
    { 
        path: 'login', 
        loadComponent: () => import('./pages/login/login').then(m => m.Login),
        canActivate: [registerGuard] 
    },
    { 
        path: 'quien-soy', 
        loadComponent: () => import('./pages/quien-soy/quien-soy').then(m => m.QuienSoy)
    },
    { 
        path: 'registro', 
        loadComponent: () => import('./pages/registro/registro').then(m => m.Registro),
        canActivate: [registerGuard] 
    },
    { 
        path: 'ahorcado', 
        loadComponent: () => import('./pages/juegos/ahorcado/ahorcado').then(m => m.Ahorcado),
        canActivate: [loginGuard] 
    },
    { 
        path: 'mayor-o-menor', 
        loadComponent: () => import('./pages/juegos/mayor-o-menor/mayor-o-menor').then(m => m.MayorOMenor),
        canActivate: [loginGuard] 
    },
    { 
        path: 'preguntados', 
        loadComponent: () => import('./pages/juegos/preguntados/preguntados').then(m => m.Preguntados),
        canActivate: [loginGuard] 
    },
    { 
        path: '1024', 
        loadComponent: () => import('./pages/juegos/juego-propio/juego-propio').then(m => m.JuegoPropio),
        canActivate: [loginGuard] 
    },
    { 
        path: 'rankings', 
        loadComponent: () => import('./pages/rankings/rankings').then(m => m.Rankings),
        canActivate: [loginGuard] 
    },
    { 
        path: '**', 
        redirectTo: '/home', 
        pathMatch: 'full'
    }
];