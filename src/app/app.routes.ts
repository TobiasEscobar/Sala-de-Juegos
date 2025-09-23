import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { QuienSoy } from './pages/quien-soy/quien-soy';
import { Registro } from './pages/registro/registro';
import { NotFound } from './components/not-found/not-found';
//Juegos
import { Ahorcado } from './pages/juegos/ahorcado/ahorcado';
import { MayorOMenor } from './pages/juegos/mayor-o-menor/mayor-o-menor';
import { Preguntados } from './pages/juegos/preguntados/preguntados';
import { JuegoPropio } from './pages/juegos/juego-propio/juego-propio';
import { loginGuard } from './guards/login-guard';
import { registerGuard } from './guards/register-guard';
import { Rankings } from './pages/rankings/rankings';


export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: Home },
    { path: 'login', component: Login, canActivate: [registerGuard] },
    { path: 'quien-soy', component: QuienSoy },
    { path: 'registro', component: Registro, canActivate: [registerGuard] },
    { path: 'ahorcado', component: Ahorcado, canActivate: [loginGuard] },
    { path: 'mayor-o-menor', component: MayorOMenor, canActivate: [loginGuard] },
    { path: 'preguntados', component: Preguntados, canActivate: [loginGuard] },
    { path: '1024', component: JuegoPropio, canActivate: [loginGuard] },
    { path: 'ranking', component: Rankings, canActivate: [loginGuard] },
    { path: '**', redirectTo: '/home', pathMatch: 'full'}
];
