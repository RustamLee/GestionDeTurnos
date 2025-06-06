// AUTHENTICATION de USUARIO

document.addEventListener('DOMContentLoaded', () => {

    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }

    async function updateUI() {
        const headerRight = document.getElementById('header-right');
        if (!headerRight) return;

        headerRight.innerHTML = '';

        const userInfo = await fetchUserInfo();

        if (userInfo && userInfo.email && userInfo.role) {
            const userDiv = document.createElement('div');
            userDiv.id = 'user-info';
            userDiv.style.display = 'flex';
            userDiv.style.alignItems = 'center';
            userDiv.style.gap = '15px';

            const roleElem = document.createElement('span');
            roleElem.className = 'user-role';
            roleElem.textContent = userInfo.role;

            const emailElem = document.createElement('span');
            emailElem.className = 'user-email';
            emailElem.textContent = userInfo.email;

            userDiv.appendChild(roleElem);
            userDiv.appendChild(emailElem);

            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'logout-btn';
            logoutBtn.innerHTML = `Salir<i class="ri-logout-circle-line" style="margin-right: 6px; vertical-align: middle;"></i>`;

            logoutBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        updateUI();
                        window.location.href = '/';
                    } else {
                        alert('Error al cerrar sesión.');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Error al cerrar sesión.');
                }
            });


            headerRight.appendChild(userDiv);
            headerRight.appendChild(logoutBtn);
        } else {
            const loginBtn = document.createElement('a');
            loginBtn.id = 'login-btn';
            loginBtn.href = '/login';
            loginBtn.className = 'header-link-btn';
            loginBtn.innerHTML = `<i class="ri-login-circle-line" style="margin-right: 6px; vertical-align: middle;"></i>Iniciar sesión`;

            const registerBtn = document.createElement('a');
            registerBtn.id = 'register-btn';
            registerBtn.href = '/register';
            registerBtn.className = 'header-link-btn';
            registerBtn.innerHTML = `<i class="ri-user-add-fill" style="margin-right: 6px; vertical-align: middle;"></i>Registrarse`;

            headerRight.appendChild(loginBtn);
            headerRight.appendChild(registerBtn);
        }
    }

    updateUI();

    // LOGIN USUARIO

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value.trim();
            const password = loginForm.password.value.trim();

            if (!email || !password) {
                alert('Completa todos los campos.');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password}),
                    credentials: 'include'
                });

                if (!response.ok) {
                    alert('Email o contraseña incorrectos.');
                    return;
                }
                const userInfo = await fetchUserInfo();

                if (userInfo && userInfo.role) {
                    if (userInfo.role === 'CLIENTE') {
                        window.location.href = '/cliente/reservas';
                    } else if (userInfo.role === 'ADMIN') {
                        window.location.href = '/admin/empleados';
                    } else if (userInfo.role === 'EMPLEADO') {
                        window.location.href = '/empleado/reservas';
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                alert('Error del servidor, intenta más tarde.');
            }
        });
    }
});

// CREAR RESERVA by CLIENTE

document.addEventListener("DOMContentLoaded", function () {
    const horaInicio = document.getElementById("horaInicio");
    const horaFin = document.getElementById("horaFin");
    const salaSelect = document.getElementById("salaId");
    const reservaForm = document.getElementById("reservaForm");
    const fechaInput = document.getElementById("fecha");

    if (!horaInicio || !horaFin || !salaSelect || !reservaForm || !fechaInput) {
        console.error("No encontre los elementos necesarios para crear la reserva.");
        return;
    }

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const maxFecha = new Date(hoy);
    maxFecha.setDate(hoy.getDate() + 30);

    const toDateString = (fecha) => fecha.toISOString().split('T')[0];

    fechaInput.min = toDateString(manana);
    fechaInput.max = toDateString(maxFecha);

    for (let h = 8; h <= 22; h++) {
        const display = h.toString().padStart(2, '0') + ":00";
        horaInicio.add(new Option(display, h));
        horaFin.add(new Option(display, h));
    }

    fetch("/api/salas")
        .then(response => {
            if (!response.ok) throw new Error("Error al cargar salas");
            return response.json();
        })
        .then(data => {
            salaSelect.length = 1;
            data.forEach(sala => {
                const descripcion = sala.descripcion ? ` - ${sala.descripcion}` : "";
                const label = `Sala ${sala.numero}(capacidad: ${sala.cantidad_personas})${descripcion}`;
                salaSelect.add(new Option(label, sala.id));
            });
        })
        .catch(error => {
            console.error("Error al cargar salas:", error);
        });

    reservaForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const inicio = parseInt(horaInicio.value);
        const fin = parseInt(horaFin.value);

        if (fin <= inicio) {
            alert("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const fecha = fechaInput.value;
        if (!fecha) {
            alert("Por favor, selecciona una fecha.");
            return;
        }

        if (fecha < fechaInput.min || fecha > fechaInput.max) {
            alert("La fecha debe estar entre mañana y los próximos 30 días.");
            return;
        }

        const fechaInicio = `${fecha}T${horaInicio.value.toString().padStart(2, '0')}:00:00`;
        const fechaFinal = `${fecha}T${horaFin.value.toString().padStart(2, '0')}:00:00`;

        const salaId = parseInt(salaSelect.value);
        if (!salaId) {
            alert("Por favor, selecciona una sala.");
            return;
        }

        const tipoPago = document.getElementById("tipoPago").value;

        const data = {
            salaId: salaId,
            fechaInicio: fechaInicio,
            fechaFinal: fechaFinal,
            tipoPago: tipoPago
        };

        try {
            const response = await fetch('/api/reserva/crear', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            const result = await response.json();

            const mensajeDiv = document.getElementById("reservaResult");

            if (response.ok) {
                mensajeDiv.innerText = `Reserva creada correctamente!`;
                reservaForm.reset();
            } else {
                let errorMessage = 'Error al crear la reserva.';
                if (result && typeof result === 'string') {
                    errorMessage = result;
                } else if (result && result.message) {
                    errorMessage = result.message;
                }
                if (errorMessage.includes('superpone')) {
                    errorMessage = 'Este horario ya está ocupado.';
                }
                mensajeDiv.innerText = errorMessage;
            }

            setTimeout(() => {
                document.getElementById("reservaResult").innerText = "";
            }, 5000);
        } catch (error) {
            document.getElementById("reservaResult").innerText = 'Error al enviar la solicitud.';
            console.error('Fetch error:', error);
        }
    });
});


// MODIFICAR RESERVA by CLIENTE

let originalValues = {};
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("updateReservaFormCliente");
    if (!form) {
        console.error("No se encontró el formulario de actualización.");
        return;
    }

    originalValues = {
        fecha: document.getElementById("fechaUpdate").value,
        horaInicio: document.getElementById("horaInicioUpdate").value,
        horaFin: document.getElementById("horaFinUpdate").value,
        salaId: document.getElementById("salaNumeroUpdate").value,
        tipoPago: document.getElementById("tipoPagoUpdate").value
    };

    const fechaInput = document.getElementById("fechaUpdate");
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const maxFecha = new Date(hoy);
    maxFecha.setDate(hoy.getDate() + 30);
    const toDateString = (fecha) => fecha.toISOString().split('T')[0];
    fechaInput.min = toDateString(manana);
    fechaInput.max = toDateString(maxFecha);

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const fecha = document.getElementById("fechaUpdate").value;
        const horaInicioRaw = document.getElementById("horaInicioUpdate").value;
        const horaFinRaw = document.getElementById("horaFinUpdate").value;
        const salaId = parseInt(document.getElementById("salaNumeroUpdate").value);
        const tipoPago = document.getElementById("tipoPagoUpdate").value;
        const reservaId = parseInt(form.querySelector("input[name='id']").value);

        if (!fecha || !horaInicioRaw || !horaFinRaw || !salaId || !tipoPago || !reservaId) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        if (horaFinRaw <= horaInicioRaw) {
            alert("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const fechaInicio = `${fecha}T${horaInicioRaw}:00`;
        const fechaFinal = `${fecha}T${horaFinRaw}:00`;

        const data = {
            id: reservaId,
            salaId: salaId,
            fechaInicio: fechaInicio,
            fechaFinal: fechaFinal,
            tipoPago: tipoPago
        };

        try {
            const response = await fetch('/api/reserva/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            const mensajeBox = document.getElementById("reservaUpdateResultCliente");
            if (response.ok) {
                const mensaje = `Reserva actualizada con éxito!`;
                showToast('success', mensaje);
                setTimeout(() => {
                    window.location.href = '/cliente/reservas';
                }, 1500);
            } else {
                let errorMessage = result.message || result.error || 'Error al actualizar la reserva.';
                if (errorMessage.includes('superpone')) {
                    errorMessage = 'Este horario ya está ocupado.';


                }
                mensajeBox.innerText = errorMessage;
                mensajeBox.style.color = "#a7288a";
                setTimeout(() => {
                    mensajeBox.innerText = "";
                    document.getElementById("fechaUpdate").value = originalValues.fecha;
                    document.getElementById("horaInicioUpdate").value = originalValues.horaInicio;
                    document.getElementById("horaFinUpdate").value = originalValues.horaFin;
                    document.getElementById("salaNumeroUpdate").value = originalValues.salaId;
                    document.getElementById("tipoPagoUpdate").value = originalValues.tipoPago;
                }, 3000);
            }


        } catch (error) {
            const mensajeBox = document.getElementById("reservaUpdateResultCliente");
            mensajeBox.innerText = "Error de red al actualizar.";
            mensajeBox.style.color = "#a7288a";
            console.error("Error en la solicitud:", error);
        }
    });
});


// CREAR RESERVA by EMPLEADO

document.addEventListener("DOMContentLoaded", function () {
    const clienteEmail = document.getElementById("clienteEmail");
    const salaSelect = document.getElementById("salaIdByEmpleado");
    const horaInicio = document.getElementById("horaInicioByEmpleado");
    const horaFin = document.getElementById("horaFinByEmpleado");
    const reservaFormEmpleado = document.getElementById("reservaFormEmpleado");
    const fechaInput = document.getElementById("fechaByEmpleado");

    if (!horaInicio || !horaFin || !salaSelect || !reservaFormEmpleado || !clienteEmail) {
        console.error("No encontre los elementos necesarios para crear la reserva.");
        return;
    }

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const maxFecha = new Date(hoy);
    maxFecha.setDate(hoy.getDate() + 30);

    const toDateString = (fecha) => fecha.toISOString().split('T')[0];

    fechaInput.min = toDateString(manana);
    fechaInput.max = toDateString(maxFecha);

    for (let h = 8; h <= 22; h++) {
        const display = h.toString().padStart(2, '0') + ":00";
        horaInicio.add(new Option(display, h));
        horaFin.add(new Option(display, h));
    }

    fetch("/api/salas")
        .then(response => {
            if (!response.ok) throw new Error("Error al cargar salas");
            return response.json();
        })
        .then(data => {
            salaSelect.length = 1;
            data.forEach(sala => {
                const descripcion = sala.descripcion ? ` - ${sala.descripcion}` : "";
                const label = `Sala ${sala.numero}(capacidad: ${sala.cantidad_personas})${descripcion}`;
                salaSelect.add(new Option(label, sala.id));
            });
        })
        .catch(error => {
            console.error("Error al cargar salas:", error);
        });


    fetch("/api/cliente/all")
        .then(response => {
            if (!response.ok) throw new Error("Error al cargar clientes");
            return response.json();
        })
        .then(data => {
            clienteEmail.length = 1;
            data.forEach(cliente => {
                const label = `${cliente.nombre} ${cliente.apellido} (${cliente.email})`;
                const value = cliente.id;
                clienteEmail.add(new Option(label, value));
            });
        })
        .catch(error => {
            console.error("Error al cargar clientes:", error);
        });

    reservaFormEmpleado.addEventListener("submit", async function (e) {
        e.preventDefault();

        const inicio = parseInt(horaInicio.value);
        const fin = parseInt(horaFin.value);

        if (fin <= inicio) {
            alert("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const fecha = fechaInput.value;
        if (!fecha) {
            alert("Por favor, selecciona una fecha.");
            return;
        }

        if (fecha < fechaInput.min || fecha > fechaInput.max) {
            alert("La fecha debe estar entre mañana y los próximos 30 días.");
            return;
        }

        if (fecha < new Date().toISOString().split('T')[0]) {
            alert("La fecha no puede ser anterior a hoy.");
            return;
        }

        const fechaInicio = `${fecha}T${horaInicio.value.padStart(2, '0')}:00:00`;
        const fechaFinal = `${fecha}T${horaFin.value.padStart(2, '0')}:00:00`;

        const salaId = parseInt(salaSelect.value);
        if (!salaId) {
            alert("Por favor, selecciona una sala.");
            return;
        }

        const tipoPago = document.getElementById("tipoPagoByEmpleado").value;
        const clienteId = parseInt(document.getElementById("clienteEmail").value);

        const data = {
            clienteId: clienteId,
            salaId: salaId,
            fechaInicio: fechaInicio,
            fechaFinal: fechaFinal,
            tipoPago: tipoPago
        };

        console.log("DATA QUE ENVÍO:", data);

        try {

            const response = await fetch('/api/reserva/crear/by-empleado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            const resultadoElement = document.getElementById("reservaResultEmpleado");

            if (response.ok) {
                resultadoElement.innerText = "¡Reserva creada correctamente!";
                reservaFormEmpleado.reset();
            } else {
                let errorMessage = result.message || 'Error al crear la reserva.';
                if (errorMessage.includes('superpone')) {
                    errorMessage = 'Este horario ya está ocupado.';
                }
                resultadoElement.innerText = errorMessage;
            }

            setTimeout(() => {
                document.getElementById("reservaResultEmpleado").innerText = "";
            }, 5000);

        } catch (error) {
            document.getElementById("reservaResultEmpleado").innerText = 'Error al enviar la solicitud.';
            console.error('Fetch error:', error);
        }
    });
});


// MOSTRAR RESERVAS PARA CLIENTE

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("reservasTableBody");
    if (!tbody) return;

    try {
        const response = await fetch('/api/salas/cliente/activas', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar reservas activas');
        const reservas = await response.json();

        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = 'No tienes reservas activas.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        reservas.forEach(reserva => {
            console.log("Reserva.fechaInicio:", reserva.fechaInicio);

            const tr = document.createElement('tr');

            const fechaInicioFormateada = reserva.fechaInicio.replace('T', ' ').slice(0, 16);
            const fechaFinalFormateada = reserva.fechaFinal.replace('T', ' ').slice(0, 16);

            // Sala
            const tdSala = document.createElement('td');
            tdSala.textContent = `#${reserva.salaNumero} (${reserva.salaCapacidad} personas)`;
            tr.appendChild(tdSala);

            // Fecha inicio
            const tdInicio = document.createElement('td');
            tdInicio.textContent = fechaInicioFormateada;
            tr.appendChild(tdInicio);

            // Fecha final
            const tdFinal = document.createElement('td');
            tdFinal.textContent = fechaFinalFormateada;
            tr.appendChild(tdFinal);

            // Tipo de pago
            const tdPago = document.createElement('td');
            tdPago.textContent = reserva.tipoPago;
            tr.appendChild(tdPago);

            // Estado
            const tdEstado = document.createElement('td');
            tdEstado.textContent = reserva.estado;
            tr.appendChild(tdEstado);

            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.classList.add('actions');

            // Editar
            const editBtn = document.createElement('a');
            editBtn.href = `/cliente/reservas/update?id=${reserva.id}`;
            editBtn.title = 'Editar';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            tdAcciones.appendChild(editBtn);

            // Cancelar
            const deleteBtn = document.createElement('button');
            deleteBtn.title = 'Cancelar reserva';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';

            deleteBtn.addEventListener('click', async () => {
                if (confirm('¿Deseas cancelar esta reserva?')) {
                    try {
                        const res = await fetch(`/api/reserva/${reserva.id}/cancelar`, {method: 'PUT'});
                        if (res.ok) {
                            tr.remove();
                            showToast('success', 'Reserva cancelada con éxito');
                        } else {
                            alert('Error al cancelar la reserva.');
                        }
                    } catch {
                        alert('Error de red al cancelar la reserva.');
                    }
                }
            });

            tdAcciones.appendChild(deleteBtn);
            tr.appendChild(tdAcciones);

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar las reservas.</td></tr>`;
    }
});


// MODIFICAR RESERVA by EMPLEADO

let originalValuesEmpleadoForm = {};
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("updateReservaFormEmpleado");
    if (!form) {
        console.error("No se encontró el formulario de actualización.");
        return;
    }
    originalValuesEmpleadoForm = {
        fecha: document.getElementById("fechaUpdate1").value,
        horaInicio: document.getElementById("horaInicioUpdate1").value,
        horaFin: document.getElementById("horaFinUpdate1").value,
        salaId: document.getElementById("salaNumeroUpdate1").value,
        tipoPago: document.getElementById("tipoPagoUpdate1").value
    };

    const fechaInput = document.getElementById("fechaUpdate1");
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const maxFecha = new Date(hoy);
    maxFecha.setDate(hoy.getDate() + 30);
    const toDateString = (fecha) => fecha.toISOString().split('T')[0];
    fechaInput.min = toDateString(manana);
    fechaInput.max = toDateString(maxFecha);


    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const fecha = document.getElementById("fechaUpdate1").value;
        const horaInicioRaw = document.getElementById("horaInicioUpdate1").value;
        const horaFinRaw = document.getElementById("horaFinUpdate1").value;
        const salaId = parseInt(document.getElementById("salaNumeroUpdate1").value);
        const tipoPago = document.getElementById("tipoPagoUpdate1").value;
        const reservaId = parseInt(form.querySelector("input[name='id']").value);

        if (!fecha || !horaInicioRaw || !horaFinRaw || !salaId || !tipoPago || !reservaId) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        if (horaFinRaw <= horaInicioRaw) {
            alert("La hora de fin debe ser mayor que la hora de inicio.");
            return;
        }

        const fechaInicio = `${fecha}T${horaInicioRaw}:00`;
        const fechaFinal = `${fecha}T${horaFinRaw}:00`;

        const data = {
            id: reservaId,
            salaId: salaId,
            fechaInicio: fechaInicio,
            fechaFinal: fechaFinal,
            tipoPago: tipoPago
        };

        try {
            const response = await fetch('/api/reserva/update/by-empleado', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            const mensajeBox = document.getElementById("reservaUpdateResultEmpleado");
            if (response.ok) {
                const mensaje = `Reserva actualizada con éxito!`;
                showToast('success', mensaje);
                setTimeout(() => {
                    window.location.href = '/empleado/reservas';
                }, 1500);
            } else {
                let errorMessage = result.message || result.error || 'Error al actualizar la reserva.';
                if (errorMessage.includes('superpone')) {
                    errorMessage = 'Este horario ya está ocupado.';


                }
                mensajeBox.innerText = errorMessage;
                mensajeBox.style.color = "#a7288a";
                setTimeout(() => {
                    mensajeBox.innerText = "";
                    document.getElementById("fechaUpdate1").value = originalValues.fecha;
                    document.getElementById("horaInicioUpdate1").value = originalValues.horaInicio;
                    document.getElementById("horaFinUpdate1").value = originalValues.horaFin;
                    document.getElementById("salaNumeroUpdate1").value = originalValues.salaId;
                    document.getElementById("tipoPagoUpdate1").value = originalValues.tipoPago;
                }, 3000);
            }


        } catch (error) {
            const mensajeBox = document.getElementById("reservaUpdateResultEmpleado");
            mensajeBox.innerText = "Error de red al actualizar.";
            mensajeBox.style.color = "#a7288a";
            console.error("Error en la solicitud:", error);
        }
    });
});


// MOSTRAR EMPLEADOS PARA ADMIN

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("empleadosTableBody");
    if (!tbody) return;

    try {
        const response = await fetch('/api/empleados', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar empleados');

        const empleados = await response.json();

        tbody.innerHTML = '';

        if (empleados.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = 'No hay empleados.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        empleados.forEach(empleado => {
            const tr = document.createElement('tr');

            // Legajo
            const tdLegajo = document.createElement('td');
            tdLegajo.textContent = empleado.legajo;
            tr.appendChild(tdLegajo);

            // Nombre Completo
            const tdNombre = document.createElement('td');
            tdNombre.textContent = `${empleado.nombre} ${empleado.apellido}`;
            tr.appendChild(tdNombre);

            // DNI
            const tdDni = document.createElement('td');
            tdDni.textContent = empleado.dni;
            tr.appendChild(tdDni);

            // Email
            const tdEmail = document.createElement('td');
            tdEmail.textContent = empleado.email;
            tr.appendChild(tdEmail);

            // Teléfono
            const tdTelefono = document.createElement('td');
            tdTelefono.textContent = empleado.telefono;
            tr.appendChild(tdTelefono);

            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.classList.add('actions');

            // editar empleado
            const editBtn = document.createElement('a');
            editBtn.href = `/admin/empleados/update?id=${empleado.id}`;
            editBtn.title = 'Editar';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            editBtn.style.marginRight = '10px';
            tdAcciones.appendChild(editBtn);

            // delete empleado

            const deleteBtn = document.createElement('button');
            deleteBtn.title = 'Eliminar';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            deleteBtn.addEventListener('click', async () => {
                if (confirm('¿Desea eliminar este empleado?')) {
                    try {
                        const res = await fetch(`/api/empleados/${empleado.id}`, {method: 'DELETE'});
                        if (res.ok) {
                            tr.remove();
                            showToast('success', 'Empleado eliminado correctamente! ');
                        } else {
                            alert('Error al eliminar el empleado.');
                        }
                    } catch {
                        alert('Error de red al eliminar el empleado.');
                    }
                }
            });
            tdAcciones.appendChild(deleteBtn);

            tr.appendChild(tdAcciones);

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar empleados.</td></tr>`;
    }
});


// CREAR EMPLEADO by ADMIN

document.addEventListener("DOMContentLoaded", function () {
    const empleadoForm = document.getElementById("empleadoCrearForm");
    if (!empleadoForm) {
        console.error("No encontre el formulario de empleado.");
        return;
    }
    empleadoForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const dni = document.getElementById("dni").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const email = document.getElementById("email").value.trim();
        const legajo = document.getElementById("legajo").value.trim();
        const contrasena = dni;

        if (!nombre || !apellido || !dni || !telefono || !email || !legajo) {
            alert("Completa todos los campos.");
            return;
        }

        const data = {
            nombre,
            apellido,
            dni,
            telefono,
            email,
            legajo,
            contrasena,
            rol: "EMPLEADO"
        };

        try {
            const response = await fetch('/api/empleados', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                const mensaje = `Empleado creado correctamente!`;
                showToast('success', mensaje);
                empleadoForm.reset();
                setTimeout(() => {
                    window.location.href = '/admin/empleados';
                }, 1500);
            } else {
                const errorText = await response.text();
                console.error('Respuesta con error:', errorText);
                alert('Error al crear el empleado.');
            }
        } catch (error) {
            console.error('Error al enviar la solicitud:', error);
            alert('Error al enviar la solicitud.');
        }
    });
});

// CREAR SALA by ADMIN

document.addEventListener("DOMContentLoaded", function () {
    const salaForm = document.getElementById("salaForm");
    if (!salaForm) {
        console.error("No encontre el formulario de sala.");
        return;
    }

    salaForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const numero = document.getElementById("numero").value.trim();
        const cantPersonas = Number(document.getElementById("capacidad").value.trim());
        const descripcion = document.getElementById("descripcion").value.trim();
        if (!numero || !cantPersonas) {
            alert("Completa todos los campos.");
            return;
        }

        const data = {
            numero: numero,
            cantidad_personas: cantPersonas,
            descripcion: descripcion
        };

        try {
            const response = await fetch('/api/salas', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('success', 'Sala creada correctamente!');
                salaForm.reset();
                setTimeout(() => {
                    window.location.href = '/admin/salas';
                }, 1500);
            } else {
                const errorText = await response.text();
                showToast('error', 'Error al crear la sala: ' + errorText);
            }
        } catch (error) {
            console.error('Error al enviar la solicitud:', error);
            alert('Error al enviar la solicitud.');
        }
    });
});


// MOSTRAR SALAS PARA ADMIN

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("salasTableBody");
    if (!tbody) return;

    try {
        const response = await fetch('/api/salas', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar salas');
        const salas = await response.json();

        tbody.innerHTML = '';

        if (salas.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'No hay salas.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        salas.forEach(sala => {
            const tr = document.createElement('tr');

            // Número
            const tdNumero = document.createElement('td');
            tdNumero.textContent = sala.numero;
            tr.appendChild(tdNumero);

            // Capacidad
            const tdCapacidad = document.createElement('td');
            tdCapacidad.textContent = sala.cantidad_personas;
            tr.appendChild(tdCapacidad);

            // Descripción
            const tdDescripcion = document.createElement('td');
            tdDescripcion.textContent = sala.descripcion || 'Sin descripción';
            tr.appendChild(tdDescripcion);

            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.classList.add('actions');

            // Edit button
            const editBtn = document.createElement('a');
            editBtn.href = `/admin/salas/update?id=${sala.id}`;
            editBtn.title = 'Editar';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            tdAcciones.appendChild(editBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.title = 'Eliminar';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            deleteBtn.addEventListener('click', async () => {
                try {
                    const canDeleteRes = await fetch(`/api/salas/${sala.id}/can-delete`);
                    const canDelete = await canDeleteRes.json();

                    if (!canDelete) {
                        alert('Esta sala no se puede eliminar porque hay reservas activas.');
                        return;
                    }
                    if (confirm('¿Desea eliminar esta sala?')) {
                        const res = await fetch(`/api/salas/${sala.id}`, {method: 'DELETE'});
                        if (res.ok) {
                            tr.remove();
                            showToast('success', 'Sala eliminada correctamente! ');
                        } else {
                            alert('Error al eliminar la sala.');
                        }
                    }
                } catch {
                    alert('Error de red al eliminar la sala.');
                }
            });
            tdAcciones.appendChild(deleteBtn);
            tr.appendChild(tdAcciones);
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Error al cargar salas.</td></tr>`;
    }
});

function showToast(type, message) {
    if (typeof toastr === 'undefined') {
        alert(message);
        return;
    }
    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'info':
            toastr.info(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        default:
            toastr.info(message);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const toastSuccess = /*[[${toastSuccess}]]*/ null;
    const toastError = /*[[${toastError}]]*/ null;

});


// MOSTRAR RESERVAS PARA EMPLEADO

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("reservasTableBodyEmpleado");
    if (!tbody) return;

    try {
        const response = await fetch('/api/reserva/all/activas', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar reservas activas');
        const reservas = await response.json();

        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = 'No tienes reservas activas.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        reservas.forEach(reserva => {
            console.log("Reserva.fechaInicio:", reserva.fechaInicio);

            const tr = document.createElement('tr');

            const fechaInicioFormateada = reserva.fechaInicio.replace('T', ' ').slice(0, 16);
            const fechaFinalFormateada = reserva.fechaFinal.replace('T', ' ').slice(0, 16);

            // Sala
            const tdSala = document.createElement('td');
            tdSala.textContent = `#${reserva.salaNumero} (${reserva.salaCapacidad} personas)`;
            tr.appendChild(tdSala);

            // Fecha inicio
            const tdInicio = document.createElement('td');
            tdInicio.textContent = fechaInicioFormateada;
            tr.appendChild(tdInicio);

            // Fecha final
            const tdFinal = document.createElement('td');
            tdFinal.textContent = fechaFinalFormateada;
            tr.appendChild(tdFinal);

            // Tipo de pago
            const tdPago = document.createElement('td');
            tdPago.textContent = reserva.tipoPago;
            tr.appendChild(tdPago);

            // Cliente
            const tdCliente = document.createElement('td');
            tdCliente.textContent = reserva.clienteEmail;
            tr.appendChild(tdCliente);

            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.classList.add('actions');

            // Editar
            const editBtn = document.createElement('a');
            editBtn.href = `/empleado/reservas/update?id=${reserva.id}`;
            editBtn.title = 'Editar';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            tdAcciones.appendChild(editBtn);

            // Cancelar
            const deleteBtn = document.createElement('button');
            deleteBtn.title = 'Cancelar reserva';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';

            deleteBtn.addEventListener('click', async () => {
                if (confirm('¿Deseas cancelar esta reserva?')) {
                    try {
                        const res = await fetch(`/api/reserva/${reserva.id}/cancelar/by-empleado`, {method: 'PUT'});
                        if (res.ok) {
                            tr.remove();
                            showToast('success', 'Reserva cancelada con éxito');
                        } else {
                            alert('Error al cancelar la reserva.');
                        }
                    } catch {
                        alert('Error de red al cancelar la reserva.');
                    }
                }
            });

            tdAcciones.appendChild(deleteBtn);
            tr.appendChild(tdAcciones);

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error al cargar las reservas.</td></tr>`;
    }
});


// MOSTRAR SALAS PARA EMPLEADO

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("salasTableBodyEmpleado");
    if (!tbody) return;

    try {
        const response = await fetch('/api/salas', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar salas');
        const salas = await response.json();

        tbody.innerHTML = '';

        if (salas.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'No hay salas.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        salas.forEach(sala => {
            const tr = document.createElement('tr');

            // Número
            const tdNumero = document.createElement('td');
            tdNumero.textContent = sala.numero;
            tr.appendChild(tdNumero);

            // Capacidad
            const tdCapacidad = document.createElement('td');
            tdCapacidad.textContent = sala.cantidad_personas;
            tr.appendChild(tdCapacidad);

            // Descripción
            const tdDescripcion = document.createElement('td');
            tdDescripcion.textContent = sala.descripcion || 'Sin descripción';
            tr.appendChild(tdDescripcion);
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Error al cargar salas.</td></tr>`;
    }
});


// MOSTRAR CLIENTES PARA EMPLEADO

document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("clientesTableBodyEmpleado");
    if (!tbody) return;

    try {
        const response = await fetch('/api/cliente/all', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al cargar clientes');
        const clientes = await response.json();

        tbody.innerHTML = '';

        if (clientes.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'No hay clientes.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        clientes.forEach(c => {
            const tr = document.createElement('tr');

            // nombre
            const tdNombre = document.createElement('td');
            tdNombre.textContent = c.nombre;
            tr.appendChild(tdNombre);

            // apellido
            const tdApellido = document.createElement('td');
            tdApellido.textContent = c.apellido;
            tr.appendChild(tdApellido);

            // DNI
            const tdDni = document.createElement('td');
            tdDni.textContent = c.dni;
            tr.appendChild(tdDni);
            // Email
            const tdEmail = document.createElement('td');
            tdEmail.textContent = c.email;
            tr.appendChild(tdEmail);

            // Teléfono
            const tdTelefono = document.createElement('td');
            tdTelefono.textContent = c.telefono;
            tr.appendChild(tdTelefono);
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Error al cargar clientes.</td></tr>`;
    }
});


function showToast(type, message) {
    if (typeof toastr === 'undefined') {
        alert(message);
        return;
    }
    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'info':
            toastr.info(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        default:
            toastr.info(message);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const toastSuccess = /*[[${toastSuccess}]]*/ null;
    const toastError = /*[[${toastError}]]*/ null;

});

