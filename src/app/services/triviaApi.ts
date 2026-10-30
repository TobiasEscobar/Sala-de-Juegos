import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface Pregunta {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  all_answers?: string[];
}

export interface TriviaResponse {
  response_code: number;
  results?: Pregunta[];
}

@Injectable({
  providedIn: 'root'
})
export class TriviaApi {
  private baseUrl = 'https://opentdb.com/api.php';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene preguntas para una categoría específica desde Open Trivia DB.
   * Si la API falla, supera el límite de peticiones (código 5) o retorna vacío,
   * se devuelven preguntas de respaldo para garantizar juego continuo.
   */
  getPreguntasPorCategoria(categoriaId: number): Observable<Pregunta[]> {
    const url = `${this.baseUrl}?amount=12&type=multiple&category=${categoriaId}`;
    
    return this.http.get<TriviaResponse>(url).pipe(
      map(response => {
        if (!response || !response.results || response.results.length === 0 || response.response_code !== 0) {
          console.warn(`[TriviaApi] Respuesta no estándar (código ${response?.response_code}), usando banco de respaldo.`);
          return this.getFallbackQuestions(categoriaId);
        }

        return response.results.map(p => ({
          ...p,
          all_answers: [...p.incorrect_answers, p.correct_answer].sort(() => Math.random() - 0.5),
          question: this.decodeHtml(p.question),
          correct_answer: this.decodeHtml(p.correct_answer),
          incorrect_answers: p.incorrect_answers.map(ans => this.decodeHtml(ans))
        }));
      }),
      catchError(error => {
        console.error('[TriviaApi] Error en llamada HTTP, aplicando preguntas de respaldo:', error);
        return of(this.getFallbackQuestions(categoriaId));
      })
    );
  }

  /**
   * Decodifica entidades HTML presentes en los textos devueltos por Open Trivia DB.
   */
  private decodeHtml(html: string): string {
    if (!html) return '';
    if (typeof document !== 'undefined') {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
    return html;
  }

  /**
   * Banco de preguntas de contingencia en español clasificadas por categoría.
   */
  getFallbackQuestions(categoriaId: number): Pregunta[] {
    const fallbackBank: Record<number, Pregunta[]> = {
      // General (Categoría 9)
      9: [
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es el océano más grande de la Tierra?',
          correct_answer: 'Océano Pacífico',
          incorrect_answers: ['Océano Atlántico', 'Océano Índico', 'Océano Ártico']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿En qué año llegó el ser humano a la Luna por primera vez?',
          correct_answer: '1969',
          incorrect_answers: ['1965', '1972', '1959']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es la capital de Australia?',
          correct_answer: 'Canberra',
          incorrect_answers: ['Sídney', 'Melbourne', 'Brisbane']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Quién pintó la famosa obra "La Gioconda" (Mona Lisa)?',
          correct_answer: 'Leonardo da Vinci',
          incorrect_answers: ['Miguel Ángel', 'Rafael Sanzio', 'Pablo Picasso']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuál es el río más caudaloso y largo del mundo?',
          correct_answer: 'Río Amazonas',
          incorrect_answers: ['Río Nilo', 'Río Yangtsé', 'Río Misisipi']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es el país más grande del mundo por superficie territorial?',
          correct_answer: 'Rusia',
          incorrect_answers: ['Canadá', 'China', 'Estados Unidos']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué instrumento musical tiene 88 teclas entre blancas y negras?',
          correct_answer: 'Piano',
          incorrect_answers: ['Órgano', 'Acordeón', 'Clavecín']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es el desierto cálido más grande del mundo?',
          correct_answer: 'Desierto del Sahara',
          incorrect_answers: ['Desierto de Atacama', 'Desierto de Gobi', 'Desierto de Kalahari']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué idioma tiene la mayor cantidad de hablantes nativos en el mundo?',
          correct_answer: 'Chino Mandarín',
          incorrect_answers: ['Inglés', 'Español', 'Hindi']
        },
        {
          category: 'Cultura General',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué continente se encuentra el monte Kilimanjaro?',
          correct_answer: 'África',
          incorrect_answers: ['Asia', 'América del Sur', 'Oceanía']
        }
      ],

      // Ciencia (Categoría 17)
      17: [
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es el elemento químico más abundante en el universo observable?',
          correct_answer: 'Hidrógeno',
          incorrect_answers: ['Helio', 'Oxígeno', 'Carbono']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuántos huesos componen el esqueleto de un ser humano adulto?',
          correct_answer: '206',
          incorrect_answers: ['195', '215', '224']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿A qué velocidad aproximada viaja la luz en el vacío?',
          correct_answer: '300.000 km/s',
          incorrect_answers: ['150.000 km/s', '450.000 km/s', '1.000.000 km/s']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué planeta del Sistema Solar es conocido popularmente como el Planeta Rojo?',
          correct_answer: 'Marte',
          incorrect_answers: ['Venus', 'Júpiter', 'Saturno']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuál es la fórmula química fundamental del agua?',
          correct_answer: 'H2O',
          incorrect_answers: ['CO2', 'NaCl', 'CH4']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es la partícula subatómica con carga eléctrica negativa?',
          correct_answer: 'Electrón',
          incorrect_answers: ['Protón', 'Neutrón', 'Positrón']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Qué órgano del cuerpo humano produce la hormona insulina?',
          correct_answer: 'Páncreas',
          incorrect_answers: ['Hígado', 'Riñones', 'Tiroides']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cómo se denomina el proceso por el cual las plantas convierten la luz solar en alimento?',
          correct_answer: 'Fotosíntesis',
          incorrect_answers: ['Respiración celular', 'Fermentación', 'Polinización']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál es la unidad de medida básica de la fuerza en el Sistema Internacional?',
          correct_answer: 'Newton',
          incorrect_answers: ['Joule', 'Pascal', 'Watt']
        },
        {
          category: 'Ciencia y Naturaleza',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuál es el gas más abundante en la atmósfera terrestre?',
          correct_answer: 'Nitrógeno',
          incorrect_answers: ['Oxígeno', 'Dióxido de carbono', 'Argón']
        }
      ],

      // Historia (Categoría 23)
      23: [
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué año dio inicio la Segunda Guerra Mundial con la invasión de Polonia?',
          correct_answer: '1939',
          incorrect_answers: ['1914', '1945', '1936']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Quién fue el primer emperador de Roma tras la caída de la República?',
          correct_answer: 'César Augusto',
          incorrect_answers: ['Julio César', 'Nerón', 'Marco Aurelio']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿En qué año se produjo la caída del Muro de Berlín?',
          correct_answer: '1989',
          incorrect_answers: ['1991', '1985', '1975']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿En qué año llegó la expedición de Cristóbal Colón a América?',
          correct_answer: '1492',
          incorrect_answers: ['1488', '1502', '1498']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Qué civilización mesoamericana construyó el templo de Kukulcán en Chichén Itzá?',
          correct_answer: 'Maya',
          incorrect_answers: ['Azteca', 'Inca', 'Olmeca']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué año se proclamó la Declaración de Independencia de los Estados Unidos?',
          correct_answer: '1776',
          incorrect_answers: ['1789', '1810', '1765']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuál fue la capital histórica del Imperio Inca?',
          correct_answer: 'Cusco',
          incorrect_answers: ['Lima', 'Machu Picchu', 'Quito']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Quién lideró la Revolución Francesa durante el período del Terror?',
          correct_answer: 'Maximilien Robespierre',
          incorrect_answers: ['Napoleón Bonaparte', 'Georges Danton', 'Jean-Paul Marat']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué antigua civilización construyó las colosales Pirámides de Giza?',
          correct_answer: 'Egipcia',
          incorrect_answers: ['Babilónica', 'Persa', 'Griega']
        },
        {
          category: 'Historia',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué año finalizó la Primera Guerra Mundial?',
          correct_answer: '1918',
          incorrect_answers: ['1914', '1920', '1923']
        }
      ],

      // Deportes (Categoría 21)
      21: [
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cada cuántos años se celebran habitualmente los Juegos Olímpicos de Verano?',
          correct_answer: '4 años',
          incorrect_answers: ['2 años', '5 años', '6 años']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué selección nacional de fútbol ha ganado más Copas del Mundo en la historia?',
          correct_answer: 'Brasil',
          incorrect_answers: ['Alemania', 'Italia', 'Argentina']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuántos jugadores por equipo se encuentran en la cancha durante un partido de básquetbol?',
          correct_answer: '5',
          incorrect_answers: ['6', '7', '4']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué disciplina deportiva obtuvo Michael Phelps 23 medallas de oro olímpicas?',
          correct_answer: 'Natación',
          incorrect_answers: ['Atletismo', 'Gimnasia artística', 'Remo']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Cuál de los cuatro torneos de Grand Slam de tenis se disputa tradicionalmente sobre hierba natural?',
          correct_answer: 'Wimbledon',
          incorrect_answers: ['Roland Garros', 'US Open', 'Australian Open']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuántos minutos reglamentarios dura un partido de fútbol convencional sin tiempos extra?',
          correct_answer: '90 minutos',
          incorrect_answers: ['80 minutos', '100 minutos', '60 minutos']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿Quién es el piloto con más campeonatos mundiales de Fórmula 1, empatado con Lewis Hamilton?',
          correct_answer: 'Michael Schumacher',
          incorrect_answers: ['Ayrton Senna', 'Sebastian Vettel', 'Alain Prost']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Qué país fue sede de los primeros Juegos Olímpicos modernos en 1896?',
          correct_answer: 'Grecia',
          incorrect_answers: ['Francia', 'Reino Unido', 'Italia']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'medium',
          question: '¿En qué deporte se utiliza una bola blanca pequeña y palos de diferentes numeraciones?',
          correct_answer: 'Golf',
          incorrect_answers: ['Cricket', 'Polo', 'Hockey sobre césped']
        },
        {
          category: 'Deportes',
          type: 'multiple',
          difficulty: 'easy',
          question: '¿Cuánto dura un asalto estándar en el boxeo profesional masculino?',
          correct_answer: '3 minutos',
          incorrect_answers: ['2 minutos', '5 minutos', '4 minutos']
        }
      ]
    };

    const questions = fallbackBank[categoriaId] || fallbackBank[9];
    // Barajar opciones y preguntas
    return questions.map(p => ({
      ...p,
      all_answers: [...p.incorrect_answers, p.correct_answer].sort(() => Math.random() - 0.5)
    })).sort(() => Math.random() - 0.5);
  }
}
