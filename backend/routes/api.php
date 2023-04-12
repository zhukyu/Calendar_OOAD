<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AttendeeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'

], function ($router) {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/user-profile', [AuthController::class, 'userProfile']);
    Route::post('/change-pass', [AuthController::class, 'changePassWord']);

    Route::get('/appointments', [AppointmentController::class, 'indexByUser']);
    Route::post('/add-appointment', [AppointmentController::class, 'store']);
    Route::post('/update-appointment/{appointment_id}', [AppointmentController::class, 'update']);

    Route::post('add-attendee', [AttendeeController::class, 'store']);
    Route::post('add-attendees', [AttendeeController::class, 'storeMultiple']);
    Route::post('update-attendees', [AttendeeController::class, 'updateMultiple']);
    Route::get('attendees/{appointment_id}', [AttendeeController::class, 'indexByAppointment']);

});

Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{str}', [UserController::class, 'find']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
