<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendee extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'attendees';
    protected $fillable = [
        'user_id',
        'appointment_id',
        'is_holder',
    ];
}
