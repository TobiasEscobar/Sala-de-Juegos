// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, map } from 'rxjs';

// export interface Pregunta {
//     category: string;
//     type: string;
//     difficulty: string;
//     question: string;
//     correct_answer: string;
//     incorrect_answers: string[];
//     all_answers?: string[];
// }

// export interface TriviaResponse {
//     response_code: number;
//     results: Pregunta[];
// }

// @Injectable({
//     providedIn: 'root'
// })
// export class TriviaApi {
//     private baseUrl = 'https://opentdb.com/api.php?amount=15&type=multiple';

//     constructor(private http: HttpClient) {}

//     // ✅ ahora recibe un parámetro opcional de categoría
//     getPreguntas(categoria?: number): Observable<Pregunta[]> {
//         const url = categoria ? `${this.baseUrl}&category=${categoria}` : this.baseUrl;

//         return this.http.get<TriviaResponse>(url).pipe(
//             map(response => {
//                 return response.results.map(pregunta => {
//                     const allAnswers = [...pregunta.incorrect_answers, pregunta.correct_answer]
//                         .sort(() => Math.random() - 0.5);

//                     return {
//                         ...pregunta,
//                         all_answers: allAnswers,
//                         question: this.decodeHtml(pregunta.question),
//                         correct_answer: this.decodeHtml(pregunta.correct_answer),
//                         incorrect_answers: pregunta.incorrect_answers.map(ans => this.decodeHtml(ans))
//                     };
//                 });
//             })
//         );
//     }

//     private decodeHtml(html: string): string {
//         const txt = document.createElement('textarea');
//         txt.innerHTML = html;
//         return txt.value;
//     }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
    results: Pregunta[];
}

@Injectable({
    providedIn: 'root'
})
export class TriviaApi {
    private baseUrl = 'https://opentdb.com/api.php?amount=15&type=multiple';

    constructor(private http: HttpClient) {}

    // ✅ ahora recibe un parámetro opcional de categoría
    getPreguntasPorCategoria(categoriaId: number): Observable<Pregunta[]> {
        const url = `https://opentdb.com/api.php?amount=15&type=multiple&category=${categoriaId}`;
        return this.http.get<TriviaResponse>(url).pipe(
            map(response => response.results.map(p => ({
            ...p,
            all_answers: [...p.incorrect_answers, p.correct_answer].sort(() => Math.random() - 0.5),
            question: this.decodeHtml(p.question),
            correct_answer: this.decodeHtml(p.correct_answer),
            incorrect_answers: p.incorrect_answers.map(ans => this.decodeHtml(ans))
            })))
        );
    }

    private decodeHtml(html: string): string {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }
}