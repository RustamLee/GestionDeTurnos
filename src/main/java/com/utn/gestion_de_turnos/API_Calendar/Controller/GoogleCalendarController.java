package com.utn.gestion_de_turnos.API_Calendar.Controller;


import com.utn.gestion_de_turnos.API_Calendar.Service.GoogleCalendarService;
import com.google.api.services.calendar.model.Event;
import io.jsonwebtoken.io.IOException;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class GoogleCalendarController {

    private final GoogleCalendarService googleCalendarService;

    @Autowired
    public GoogleCalendarController(GoogleCalendarService googleCalendarService) {
        this.googleCalendarService = googleCalendarService;
    }

    @PostMapping("/events")
    public String crearEvento(
            @RequestParam String resumen,
            @RequestParam String descripcion,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin
    ) throws Exception {
        googleCalendarService.crearEventoSimple(resumen, descripcion, fechaInicio, fechaFin);
        return "✅ Evento creado correctamente.";
    }

    // 📌 Endpoint para empleados (ver todos los eventos con detalle)
    @GetMapping("/empleado")
    public List<Event> verTodosLosEventosEmpleado() throws IOException, java.io.IOException {
        return googleCalendarService.listarTodosLosEventos();
    }

    // 📌 Endpoint para clientes (ver solo sus eventos + "ocupado")
    @GetMapping("/cliente")
    public List<Event> verEventosCliente(@RequestParam String email) throws IOException, java.io.IOException {
        return googleCalendarService.listarEventosParaCliente(email);
    }

    // 📌 Este Endpoint hace lo mismo que el metodo de arriba pero no hace falta pasarle el mail por paramentro ya sabe cual es cuando hace el login con Spring Security
    @GetMapping("cliente ")
    public List<Event> listarEventosDelClienteAutenticado(Authentication authentication) throws IOException, java.io.IOException {
        String emailCliente = authentication.getName(); // o getPrincipal().getUsername()
        return googleCalendarService.listarEventosParaCliente(emailCliente);
    }



    @DeleteMapping("/events/{eventId}")
    public String borrarEvento(@PathVariable String eventId) throws Exception {
        googleCalendarService.borrarEventoPorId(eventId);
        return "🗑️ Evento eliminado con ID: " + eventId;
    }

    @GetMapping("/events/{eventId}")
    public Event obtenerEventoPorId(@PathVariable String eventId) throws Exception {
        return googleCalendarService.obtenerEventoPorId(eventId);
    }

    @GetMapping("/calendars")
    public String listarCalendarios() throws Exception {
        googleCalendarService.listarCalendarios();
        return "📚 Lista de calendarios mostrada por consola.";
    }
}
