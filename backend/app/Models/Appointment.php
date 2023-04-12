<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'appointments';
    protected $fillable = [
        'name',
        'user_id',
        'location',
        'start_time',
        'end_time',
        'is_reminded',
        'is_group_meeting',
    ];
}
