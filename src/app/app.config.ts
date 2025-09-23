import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideHttpClient, withFetch } from '@angular/common/http';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

const supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()), provideHttpClient(withFetch()),
    { provide: SupabaseClient, useValue: supabase }
  ]
};